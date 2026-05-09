import { getDb } from "@/lib/db"
import { finnhubFetch } from "@/lib/finnhub"

export interface PositionHistoryEntry {
  id: number
  account_id: number
  symbol: string
  date: string
  quantity: number
  market_price: number
  market_value: number
  cost_basis: number
  unrealized_pnl: number
}

export async function getPositionHistory(accountId: number): Promise<PositionHistoryEntry[]> {
  const sql = getDb()

  const rows = await sql`
    SELECT id, account_id, symbol, date, quantity, market_price, market_value, cost_basis, unrealized_pnl
    FROM position_history
    WHERE account_id = ${accountId}
    ORDER BY date DESC, symbol
  `

  return rows.map((r) => ({
    id: r.id as number,
    account_id: r.account_id as number,
    symbol: r.symbol as string,
    date: (r.date as Date).toISOString().slice(0, 10),
    quantity: Number(r.quantity),
    market_price: Number(r.market_price),
    market_value: Number(r.market_value),
    cost_basis: Number(r.cost_basis),
    unrealized_pnl: Number(r.unrealized_pnl),
  }))
}

interface PositionRow {
  account_id: number
  symbol: string
  quantity: number
  average_cost_basis: number
}

/**
 * Snapshots every open position across all accounts into position_history.
 * Designed to run once daily after market close (4:30 PM ET via Vercel cron).
 */
export async function snapshotAllPositions(): Promise<{
  snapshotCount: number
  errors: string[]
}> {
  const sql = getDb()
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  // 1. Get all open positions across all accounts
  const rows = await sql`
    SELECT account_id, symbol, quantity, average_cost_basis
    FROM positions
    WHERE quantity > 0
    ORDER BY symbol
  `

  if (rows.length === 0) {
    return { snapshotCount: 0, errors: [] }
  }

  const positions: PositionRow[] = rows.map((r) => ({
    account_id: r.account_id as number,
    symbol: r.symbol as string,
    quantity: Number(r.quantity),
    average_cost_basis: Number(r.average_cost_basis),
  }))

  // 2. Deduplicate symbols and batch-fetch prices from Finnhub
  const uniqueSymbols = [...new Set(positions.map((p) => p.symbol))]
  const priceMap = new Map<string, number>()
  const errors: string[] = []

  const quoteResults = await Promise.allSettled(
    uniqueSymbols.map(async (symbol) => {
      const quote = (await finnhubFetch("/quote", { symbol })) as { c: number }
      return { symbol, price: quote.c }
    })
  )

  for (const result of quoteResults) {
    if (result.status === "fulfilled" && result.value.price) {
      priceMap.set(result.value.symbol, result.value.price)
    } else if (result.status === "rejected") {
      errors.push(`Failed to fetch quote: ${result.reason}`)
    } else if (result.status === "fulfilled") {
      errors.push(`No price returned for ${result.value.symbol}`)
    }
  }

  // 3. Build per-symbol INSERT statements for positions that have a valid price.
  const insertStatements = positions
    .filter((pos) => priceMap.has(pos.symbol))
    .map((pos) => {
      const marketPrice = priceMap.get(pos.symbol)!
      const marketValue = pos.quantity * marketPrice
      const costBasis = pos.quantity * pos.average_cost_basis
      const unrealizedPnl = marketValue - costBasis
      return sql`
        INSERT INTO position_history (account_id, symbol, date, quantity, market_price, market_value, cost_basis, unrealized_pnl)
        VALUES (${pos.account_id}, ${pos.symbol}, ${today}, ${pos.quantity}, ${marketPrice}, ${marketValue}, ${costBasis}, ${unrealizedPnl})
        ON CONFLICT (account_id, symbol, date) DO UPDATE SET
          quantity = EXCLUDED.quantity,
          market_price = EXCLUDED.market_price,
          market_value = EXCLUDED.market_value,
          cost_basis = EXCLUDED.cost_basis,
          unrealized_pnl = EXCLUDED.unrealized_pnl
      `
    })

  const snapshotCount = insertStatements.length
  if (snapshotCount === 0) {
    return { snapshotCount: 0, errors }
  }

  // 4. Roll up holdings + cash into portfolio_daily_value for every affected
  //    account in a single statement. Runs in the same transaction as the
  //    inserts above so the SELECT sees them and the two tables can never drift.
  const rollupStatement = sql`
    INSERT INTO portfolio_daily_value (account_id, date, market_value, cost_basis, cash_balance, net_cash_flow)
    SELECT
      ph.account_id,
      ph.date,
      SUM(ph.market_value)::numeric(16,2),
      SUM(ph.cost_basis)::numeric(16,2),
      COALESCE((
        SELECT cl.running_balance FROM cash_ledger cl
        WHERE cl.account_id = ph.account_id
          AND cl.created_at::date <= ph.date
        ORDER BY cl.created_at DESC LIMIT 1
      ), 0)::numeric(16,2),
      COALESCE((
        SELECT SUM(cl.amount) FROM cash_ledger cl
        WHERE cl.account_id = ph.account_id
          AND cl.entry_type IN ('deposit', 'withdrawal')
          AND cl.created_at > COALESCE(
            (SELECT MAX(pdv.date) + INTERVAL '1 day'
             FROM portfolio_daily_value pdv
             WHERE pdv.account_id = ph.account_id AND pdv.date < ph.date),
            'epoch'::timestamptz
          )
          AND cl.created_at < (ph.date + INTERVAL '1 day')
      ), 0)::numeric(16,2)
    FROM position_history ph
    WHERE ph.date = ${today}::date
    GROUP BY ph.account_id, ph.date
    ON CONFLICT (account_id, date) DO UPDATE SET
      market_value = EXCLUDED.market_value,
      cost_basis = EXCLUDED.cost_basis,
      cash_balance = EXCLUDED.cash_balance,
      net_cash_flow = EXCLUDED.net_cash_flow
  `

  await sql.transaction([...insertStatements, rollupStatement])

  return { snapshotCount, errors }
}
