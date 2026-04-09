import { getDb } from "@/lib/db"
import { finnhubFetch } from "@/lib/finnhub"
import { getSubscriptionsByUserIds, deleteSubscriptionById } from "@/services/push-subscription-service"
import { sendPushNotification } from "@/services/notification-service"
import { insertMissedAlert } from "@/services/alerts/missed-alerts-service"

type ActiveAlert = {
  id: number
  account_id: number
  user_id: number
  symbol: string
  condition: "price_above" | "price_below"
  target_value: number
}

export async function checkAlerts() {
  const sql = getDb()

  // Fetch all active price alerts with their owner's user_id
  const rows = await sql`
    SELECT sa.id, sa.account_id, a.user_id, sa.symbol, sa.condition, sa.target_value
    FROM stock_alerts sa
    JOIN accounts a ON a.id = sa.account_id
    WHERE sa.status = 'active'
      AND sa.condition IN ('price_above', 'price_below')
      AND sa.target_value IS NOT NULL
  `
  const alerts = rows as unknown as ActiveAlert[]
  if (alerts.length === 0) return { checked: 0, triggered: 0, failed: 0 }

  // Get unique symbols and fetch their current prices
  const symbols = [...new Set(alerts.map((a) => a.symbol))]
  const prices = new Map<string, number>()
  let quoteFailed = 0

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await finnhubFetch("/quote", { symbol })
        if (typeof quote.c === "number" && quote.c > 0) {
          prices.set(symbol, quote.c)
        }
      } catch (err) {
        quoteFailed++
        console.error(`[alert-checker] Failed to fetch quote for ${symbol}:`, err)
      }
    }),
  )

  // Evaluate each alert
  const triggered: ActiveAlert[] = []
  for (const alert of alerts) {
    const price = prices.get(alert.symbol)
    if (price === undefined) continue

    const hit =
      (alert.condition === "price_above" && price >= alert.target_value) ||
      (alert.condition === "price_below" && price <= alert.target_value)

    if (hit) triggered.push(alert)
  }

  if (triggered.length === 0) {
    return { checked: alerts.length, triggered: 0, failed: 0, quoteFailed }
  }

  // Atomically claim triggered alerts to prevent duplicate processing 
  const triggeredIds = triggered.map((a) => a.id)
  const claimed = await sql`
    UPDATE stock_alerts
    SET status = 'triggered', triggered_at = NOW()
    WHERE id = ANY(${triggeredIds}) AND status = 'active'
    RETURNING id
  `
  const claimedIds = new Set(claimed.map((r) => r.id as number))
  const claimedAlerts = triggered.filter((a) => claimedIds.has(a.id))

  if (claimedAlerts.length === 0) {
    return { checked: alerts.length, triggered: 0, failed: 0, quoteFailed }
  }

  // Send push notifications (track failures per alert)
  const userIds = [...new Set(claimedAlerts.map((a) => a.user_id))]
  const subscriptions = await getSubscriptionsByUserIds(userIds)
  const failedAlertIds: number[] = []

  await Promise.all(
    claimedAlerts.map(async (alert) => {
      const userSubs = subscriptions.filter((s) => s.user_id === alert.user_id)
      if (userSubs.length === 0) return

      const price = prices.get(alert.symbol)!
      const direction = alert.condition === "price_above" ? "above" : "below"
      const payload = {
        title: `${alert.symbol} Alert Triggered`,
        body: `${alert.symbol} is now $${price.toFixed(2)} — hit your ${direction} target of $${Number(alert.target_value).toFixed(2)}`,
        url: `/details/${alert.symbol.toLowerCase()}`,
      }

      const results = await Promise.all(
        userSubs.map(async (sub) => {
          const result = await sendPushNotification(sub, payload)
          if (!result.ok) {
            console.error(`[alert-checker] Push failed for subscription ${sub.id}:`, result.error)
            if (result.gone) {
              await deleteSubscriptionById(sub.id).catch(() => {})
            }
          }
          return result.ok
        }),
      )

      // If every subscription failed, mark this alert as failed
      if (results.every((r) => !r)) {
        failedAlertIds.push(alert.id)
      }
    }),
  )

  // Revert alerts where ALL notification attempts failed
  if (failedAlertIds.length > 0) {
    await sql`
      UPDATE stock_alerts
      SET status = 'active', triggered_at = NULL
      WHERE id = ANY(${failedAlertIds})
    `
  }

  // Record missed alerts only for successfully triggered alerts
  const failedSet = new Set(failedAlertIds)
  const succeededAlerts = claimedAlerts.filter((a) => !failedSet.has(a.id))
  if (succeededAlerts.length > 0) {
    await Promise.all(
      succeededAlerts.map((alert) =>
        insertMissedAlert(
          alert.account_id,
          alert.symbol,
          alert.condition,
          alert.target_value,
          prices.get(alert.symbol)!,
        ),
      ),
    )
  }

  return {
    checked: alerts.length,
    triggered: claimedAlerts.length - failedAlertIds.length,
    failed: failedAlertIds.length,
    quoteFailed,
  }
}
