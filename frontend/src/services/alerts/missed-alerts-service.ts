import { getDb } from "@/lib/db"

export type MissedAlert = {
  id: number
  symbol: string
  condition: "price_above" | "price_below" | "earnings" | "ai_signal"
  target_value: number | null
  triggered_price: number
  created_at: string
}

export async function getMissedAlerts(accountId: number): Promise<MissedAlert[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, symbol, condition, target_value, triggered_price, created_at
    FROM missed_alerts
    WHERE account_id = ${accountId}
    ORDER BY created_at DESC
  `
  return rows.map((r) => ({
    id: r.id as number,
    symbol: r.symbol as string,
    condition: r.condition as MissedAlert["condition"],
    target_value: r.target_value ? Number(r.target_value) : null,
    triggered_price: Number(r.triggered_price),
    created_at: String(r.created_at),
  }))
}

export async function deleteMissedAlerts(accountId: number): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM missed_alerts WHERE account_id = ${accountId}`
}

export async function insertMissedAlert(
  accountId: number,
  symbol: string,
  condition: string,
  targetValue: number | null,
  triggeredPrice: number,
): Promise<void> {
  const sql = getDb()
  await sql`
    INSERT INTO missed_alerts (account_id, symbol, condition, target_value, triggered_price)
    VALUES (${accountId}, ${symbol}, ${condition}, ${targetValue}, ${triggeredPrice})
  `
}
