import { getDb } from "@/lib/db"

export type AlertCondition = "price_above" | "price_below" | "earnings" | "ai_signal"
export type AlertStatus = "active" | "triggered" | "cancelled"

export type StockAlert = {
  id: number
  symbol: string
  condition: AlertCondition
  target_value: number | null
  status: AlertStatus
  triggered_at: string | null
  created_at: string
}

export async function getAlerts(accountId: number): Promise<StockAlert[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, symbol, condition, target_value, status, triggered_at, created_at
    FROM stock_alerts
    WHERE account_id = ${accountId}
    ORDER BY created_at DESC
  `
  return rows.map((r) => ({
    id: r.id as number,
    symbol: r.symbol as string,
    condition: r.condition as AlertCondition,
    target_value: r.target_value ? Number(r.target_value) : null,
    status: r.status as AlertStatus,
    triggered_at: r.triggered_at ? String(r.triggered_at) : null,
    created_at: String(r.created_at),
  }))
}

export async function createAlert(
  accountId: number,
  symbol: string,
  condition: AlertCondition,
  targetValue: number,
) {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO stock_alerts (account_id, symbol, condition, target_value)
    VALUES (${accountId}, ${symbol}, ${condition}, ${targetValue})
    RETURNING id, symbol, condition, target_value, status, created_at
  `
  return rows[0]
}

export async function deleteAlert(accountId: number, alertId: number): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    DELETE FROM stock_alerts
    WHERE id = ${alertId} AND account_id = ${accountId}
    RETURNING id
  `
  return rows.length > 0
}
