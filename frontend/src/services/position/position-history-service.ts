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

  // 3. Build and insert snapshot rows for positions that have a valid price
  let snapshotCount = 0

  for (const pos of positions) {
    const marketPrice = priceMap.get(pos.symbol)
    if (!marketPrice) continue

    const marketValue = pos.quantity * marketPrice
    const costBasis = pos.quantity * pos.average_cost_basis
    const unrealizedPnl = marketValue - costBasis

    await sql`
      INSERT INTO position_history (account_id, symbol, date, quantity, market_price, market_value, cost_basis, unrealized_pnl)
      VALUES (${pos.account_id}, ${pos.symbol}, ${today}, ${pos.quantity}, ${marketPrice}, ${marketValue}, ${costBasis}, ${unrealizedPnl})
      ON CONFLICT (account_id, symbol, date) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        market_price = EXCLUDED.market_price,
        market_value = EXCLUDED.market_value,
        cost_basis = EXCLUDED.cost_basis,
        unrealized_pnl = EXCLUDED.unrealized_pnl
    `
    snapshotCount++
  }

  return { snapshotCount, errors }
}
