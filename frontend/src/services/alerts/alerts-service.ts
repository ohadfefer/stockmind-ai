import { getDb } from "@/lib/db"

export type AlertCondition = "price_above" | "price_below" | "earnings" | "ai_signal"
export type AlertStatus = "active" | "triggered" | "cancelled"

// Postgres DATE columns come back as a JS Date built from local-time components.
// Using toISOString() would shift to UTC and lose a day east of UTC, so we
// extract local components directly.
function dbDateToIso(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, "0")
    const d = String(value.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
  return String(value).slice(0, 10)
}

export type StockAlert = {
  id: number
  symbol: string
  condition: AlertCondition
  target_value: number | null
  earnings_date: string | null
  status: AlertStatus
  triggered_at: string | null
  created_at: string
}

/**
 * One row shape for reads and writes alike. Shared so the 201 body from
 * createAlert can't drift from the rows GET returns — target_value arrives
 * from a NUMERIC column as a string, and only this mapper turns it into the
 * number the client's `.toFixed()` calls assume.
 */
function toStockAlert(r: Record<string, unknown>): StockAlert {
  return {
    id: r.id as number,
    symbol: r.symbol as string,
    condition: r.condition as AlertCondition,
    target_value: r.target_value ? Number(r.target_value) : null,
    earnings_date: dbDateToIso(r.earnings_date),
    status: r.status as AlertStatus,
    triggered_at: r.triggered_at ? String(r.triggered_at) : null,
    created_at: String(r.created_at),
  }
}

export async function getAlerts(accountId: number): Promise<StockAlert[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, symbol, condition, target_value, earnings_date, status, triggered_at, created_at
    FROM stock_alerts
    WHERE account_id = ${accountId}
    ORDER BY created_at DESC
  `
  return rows.map(toStockAlert)
}

export async function createAlert(
  accountId: number,
  symbol: string,
  condition: AlertCondition,
  targetValue: number | null,
  earningsDate: string | null = null,
): Promise<StockAlert> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO stock_alerts (account_id, symbol, condition, target_value, earnings_date)
    VALUES (${accountId}, ${symbol}, ${condition}, ${targetValue}, ${earningsDate})
    RETURNING id, symbol, condition, target_value, earnings_date, status, triggered_at, created_at
  `
  return toStockAlert(rows[0])
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
