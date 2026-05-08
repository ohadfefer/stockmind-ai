import { getDb } from "@/lib/db"

export interface PortfolioDailyValue {
  date: string // YYYY-MM-DD
  marketValue: number
  costBasis: number
  cashBalance: number
  netCashFlow: number
  totalValue: number
}

export interface PortfolioStats {
  gainDays: number
  totalDays: number
  avgDailyReturnPct: number
}

export async function getPortfolioDailyValues(
  accountId: number,
): Promise<PortfolioDailyValue[]> {
  const sql = getDb()

  const rows = await sql`
    SELECT date, market_value, cost_basis, cash_balance, net_cash_flow, total_value
    FROM portfolio_daily_value
    WHERE account_id = ${accountId}
    ORDER BY date ASC
  `

  return rows.map((r) => ({
    date: (r.date as Date).toISOString().slice(0, 10),
    marketValue: Number(r.market_value),
    costBasis: Number(r.cost_basis),
    cashBalance: Number(r.cash_balance),
    netCashFlow: Number(r.net_cash_flow),
    totalValue: Number(r.total_value),
  }))
}

export async function getPortfolioStats(accountId: number): Promise<PortfolioStats> {
  const sql = getDb()

  const rows = await sql`
    WITH returns AS (
      SELECT
        total_value,
        LAG(total_value) OVER (ORDER BY date) AS prev_total,
        net_cash_flow
      FROM portfolio_daily_value
      WHERE account_id = ${accountId}
    )
    SELECT
      COUNT(*) FILTER (
        WHERE prev_total IS NOT NULL AND prev_total > 0
          AND (total_value - prev_total - net_cash_flow) > 0
      ) AS gain_days,
      COUNT(*) FILTER (
        WHERE prev_total IS NOT NULL AND prev_total > 0
      ) AS total_days,
      COALESCE(AVG(
        CASE WHEN prev_total IS NOT NULL AND prev_total > 0
             THEN (total_value - prev_total - net_cash_flow) / prev_total * 100
        END
      ), 0) AS avg_daily_return_pct
    FROM returns
  `

  const r = rows[0]
  return {
    gainDays: Number(r.gain_days),
    totalDays: Number(r.total_days),
    avgDailyReturnPct: Number(r.avg_daily_return_pct),
  }
}
