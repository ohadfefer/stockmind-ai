import { getDb } from "@/lib/db"
import { getSubscriptionsByAccountIds, deleteSubscriptionById } from "@/services/push-subscription-service"
import { sendPushNotification } from "@/services/notification-service"
import { insertMissedAlert } from "@/services/alerts/missed-alerts-service"

type EarningsAlert = {
  id: number
  account_id: number
  symbol: string
}

export async function checkEarningsAlerts() {
  const sql = getDb()

  const rows = await sql`
    SELECT id, account_id, symbol
    FROM stock_alerts
    WHERE status = 'active'
      AND condition = 'earnings'
      AND earnings_date IS NOT NULL
      AND earnings_date <= CURRENT_DATE
  `
  const alerts = rows as unknown as EarningsAlert[]
  if (alerts.length === 0) return { checked: 0, triggered: 0, failed: 0 }

  // Atomically claim due alerts to prevent duplicate notifications
  const dueIds = alerts.map((a) => a.id)
  const claimed = await sql`
    UPDATE stock_alerts
    SET status = 'triggered', triggered_at = NOW()
    WHERE id = ANY(${dueIds}) AND status = 'active'
    RETURNING id
  `
  const claimedIds = new Set(claimed.map((r) => r.id as number))
  const claimedAlerts = alerts.filter((a) => claimedIds.has(a.id))

  if (claimedAlerts.length === 0) {
    return { checked: alerts.length, triggered: 0, failed: 0 }
  }

  const accountIds = [...new Set(claimedAlerts.map((a) => a.account_id))]
  const subscriptions = await getSubscriptionsByAccountIds(accountIds)
  const failedAlertIds: number[] = []

  await Promise.all(
    claimedAlerts.map(async (alert) => {
      const accountSubs = subscriptions.filter((s) => s.account_id === alert.account_id)
      if (accountSubs.length === 0) return

      const payload = {
        title: `${alert.symbol} Earnings Alert`,
        body: `Earnings for ${alert.symbol} are scheduled around now.`,
        url: `/details/${alert.symbol.toLowerCase()}`,
      }

      const results = await Promise.all(
        accountSubs.map(async (sub) => {
          const result = await sendPushNotification(sub, payload)
          if (!result.ok) {
            console.error(`[earnings-alert-checker] Push failed for subscription ${sub.id}:`, result.error)
            if (result.gone) {
              await deleteSubscriptionById(sub.id).catch(() => {})
            }
          }
          return result.ok
        }),
      )

      if (results.every((r) => !r)) {
        failedAlertIds.push(alert.id)
      }
    }),
  )

  if (failedAlertIds.length > 0) {
    await sql`
      UPDATE stock_alerts
      SET status = 'active', triggered_at = NULL
      WHERE id = ANY(${failedAlertIds})
    `
  }

  const failedSet = new Set(failedAlertIds)
  const succeededAlerts = claimedAlerts.filter((a) => !failedSet.has(a.id))
  if (succeededAlerts.length > 0) {
    await Promise.all(
      succeededAlerts.map((alert) =>
        insertMissedAlert(alert.account_id, alert.symbol, "earnings", null, null),
      ),
    )
  }

  return {
    checked: alerts.length,
    triggered: claimedAlerts.length - failedAlertIds.length,
    failed: failedAlertIds.length,
  }
}
