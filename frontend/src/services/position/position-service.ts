import { getDb } from "@/lib/db"

export interface Position {
  id: number
  account_id: number
  symbol: string
  quantity: number
  average_cost_basis: number
  realized_pnl: number
  updated_at: string
}

const POSITIONS_TTL_MS = 60_000
const positionsCache = new Map<
  number,
  { positions: Position[]; fetchedAt: number }
>()
// Bumped on every invalidation. A getPositions read that began before the most
// recent bump refuses to write its (now stale) rows back into the cache, so a
// poll racing a concurrent trade can't re-cache pre-trade holdings.
let positionsEpoch = 0

/** Drop the cached positions for an account (call after a trade mutates them). */
export function invalidatePositions(accountId: number): void {
  positionsCache.delete(accountId)
  positionsEpoch++
}

interface UpdatePositionParams {
  accountId: number
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  commission: number
  fees: number
}

export async function updatePosition(params: UpdatePositionParams): Promise<void> {
  const sql = getDb()

  const rows = await sql`
    SELECT quantity, average_cost_basis, realized_pnl
    FROM positions
    WHERE account_id = ${params.accountId} AND symbol = ${params.symbol}
  `

  if (params.side === "buy") {
    const totalCost = params.quantity * params.price + params.commission + params.fees
    const costPerShare = totalCost / params.quantity

    if (rows.length === 0) {
      // New position
      await sql`
        INSERT INTO positions (account_id, symbol, quantity, average_cost_basis, realized_pnl)
        VALUES (${params.accountId}, ${params.symbol}, ${params.quantity}, ${costPerShare}, 0)
      `
    } else {
      // Add to existing — recalculate weighted average cost basis
      const existing = rows[0]
      const oldQty = Number(existing.quantity)
      const oldCost = Number(existing.average_cost_basis)
      const newQty = oldQty + params.quantity
      const newCost = (oldQty * oldCost + totalCost) / newQty

      await sql`
        UPDATE positions
        SET quantity = ${newQty},
            average_cost_basis = ${newCost},
            updated_at = NOW()
        WHERE account_id = ${params.accountId} AND symbol = ${params.symbol}
      `
    }
    invalidatePositions(params.accountId)
  } else {
    // Sell — reduce quantity, realize P&L
    if (rows.length === 0) return // nothing to sell

    const existing = rows[0]
    const oldQty = Number(existing.quantity)
    const avgCost = Number(existing.average_cost_basis)
    const oldPnl = Number(existing.realized_pnl)
    const sellQty = Math.min(params.quantity, oldQty)
    const pnl = (params.price - avgCost) * sellQty - params.commission - params.fees
    const newQty = oldQty - sellQty

    await sql`
      UPDATE positions
      SET quantity = ${newQty},
          realized_pnl = ${oldPnl + pnl},
          updated_at = NOW()
      WHERE account_id = ${params.accountId} AND symbol = ${params.symbol}
    `
    invalidatePositions(params.accountId)
  }
}

export async function getPositions(accountId: number): Promise<Position[]> {
  const cached = positionsCache.get(accountId)
  if (cached && Date.now() - cached.fetchedAt < POSITIONS_TTL_MS) {
    return cached.positions
  }

  const startedEpoch = positionsEpoch
  const sql = getDb()

  const rows = await sql`
    SELECT id, account_id, symbol, quantity, average_cost_basis, realized_pnl, updated_at
    FROM positions
    WHERE account_id = ${accountId} AND quantity > 0
    ORDER BY symbol
  `

  const positions: Position[] = rows.map((r) => ({
    id: r.id as number,
    account_id: r.account_id as number,
    symbol: r.symbol as string,
    quantity: Number(r.quantity),
    average_cost_basis: Number(r.average_cost_basis),
    realized_pnl: Number(r.realized_pnl),
    updated_at: r.updated_at as string,
  }))

  // Skip the write if an invalidation landed while this query was in flight —
  // these rows may predate the trade that triggered it.
  if (positionsEpoch === startedEpoch) {
    positionsCache.set(accountId, { positions, fetchedAt: Date.now() })
  }
  return positions
}
