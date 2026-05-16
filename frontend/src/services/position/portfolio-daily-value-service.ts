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

// portfolio_daily_value is written once per weekday by the snapshot cron at
// 21:30 UTC (see vercel.json), which dates each row with the UTC date. So the
// stats are stable all day and only change after that run. Key the cache by
// the latest expected snapshot date: constant within a day (every dashboard
// hit shares one query) and advancing once the cron has finished, which picks
// up fresh data with no cross-process invalidation. On weekends/holidays the
// cron doesn't run, so the key may advance into a day with no new row — that
// just costs one extra (identical) query, which is fine.
//
// The cutoff is the cron start PLUS settle headroom: the job fetches quotes
// for every position and writes in a transaction, so it finishes after 21:30.
// Advancing the key only after it has settled prevents a request landing
// mid-run from caching pre-snapshot stats under the post-snapshot date (which
// would pin stale stats until the next day's rollover).
const SNAPSHOT_CRON_UTC_MINUTES = 21 * 60 + 30 // 21:30 UTC (vercel.json)
const SNAPSHOT_SETTLE_MINUTES = 30 // headroom for the job to finish
const SNAPSHOT_CUTOFF_UTC_MINUTES =
  SNAPSHOT_CRON_UTC_MINUTES + SNAPSHOT_SETTLE_MINUTES

function latestSnapshotDate(now = new Date()): string {
  const minutesUtc = now.getUTCHours() * 60 + now.getUTCMinutes()
  const d = new Date(now)
  if (minutesUtc < SNAPSHOT_CUTOFF_UTC_MINUTES) {
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return d.toISOString().slice(0, 10)
}

// One entry per account; self-replaces when latestSnapshotDate() rolls over,
// so the map can't grow unbounded (same shape as positionsCache).
const statsCache = new Map<number, { date: string; stats: PortfolioStats }>()

export async function getPortfolioStats(accountId: number): Promise<PortfolioStats> {
  const date = latestSnapshotDate()
  const cached = statsCache.get(accountId)
  if (cached && cached.date === date) {
    return cached.stats
  }

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
  const stats: PortfolioStats = {
    gainDays: Number(r.gain_days),
    totalDays: Number(r.total_days),
    avgDailyReturnPct: Number(r.avg_daily_return_pct),
  }

  statsCache.set(accountId, { date, stats })
  return stats
}
