import { getDb } from "@/lib/db"
import { finnhubFetch } from "@/lib/finnhub"
import { getSubscriptionsByUserIds } from "@/services/push-subscription-service"
import { sendPushNotification } from "@/services/notification-service"

type ActiveAlert = {
  id: number
  user_id: number
  symbol: string
  condition: "price_above" | "price_below"
  target_value: number
}

export async function checkAlerts() {
  const sql = getDb()

  // Fetch all active price alerts with their owner's user_id
  const rows = await sql`
    SELECT sa.id, a.user_id, sa.symbol, sa.condition, sa.target_value
    FROM stock_alerts sa
    JOIN accounts a ON a.id = sa.account_id
    WHERE sa.status = 'active'
      AND sa.condition IN ('price_above', 'price_below')
      AND sa.target_value IS NOT NULL
  `
  const alerts = rows as unknown as ActiveAlert[]
  if (alerts.length === 0) return { checked: 0, triggered: 0 }

  // Get unique symbols and fetch their current prices
  const symbols = [...new Set(alerts.map((a) => a.symbol))]
  const prices = new Map<string, number>()

  await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await finnhubFetch("/quote", { symbol })
        if (quote.c > 0) prices.set(symbol, quote.c)
      } catch {
        // skip symbol if quote fails
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

  if (triggered.length === 0) return { checked: alerts.length, triggered: 0 }

  // Mark triggered alerts
  const triggeredIds = triggered.map((a) => a.id)
  await sql`
    UPDATE stock_alerts
    SET status = 'triggered', triggered_at = NOW()
    WHERE id = ANY(${triggeredIds})
  `

  // Send push notifications
  const userIds = [...new Set(triggered.map((a) => a.user_id))]
  const subscriptions = await getSubscriptionsByUserIds(userIds)

  await Promise.all(
    triggered.map(async (alert) => {
      const userSubs = subscriptions.filter((s) => s.user_id === alert.user_id)
      const price = prices.get(alert.symbol)!
      const direction = alert.condition === "price_above" ? "above" : "below"
      const payload = {
        title: `${alert.symbol} Alert Triggered`,
        body: `${alert.symbol} is now $${price.toFixed(2)} — hit your ${direction} target of $${Number(alert.target_value).toFixed(2)}`,
        url: `/details/${alert.symbol.toLowerCase()}`,
      }

      await Promise.all(
        userSubs.map((sub) => sendPushNotification(sub, payload).catch(() => {})),
      )
    }),
  )

  return { checked: alerts.length, triggered: triggered.length }
}
