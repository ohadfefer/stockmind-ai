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

/**
 * Applies one execution to the materialized position.
 *
 * Both branches are a single statement so the read and the write cannot be
 * split by a concurrent trade. The previous SELECT-then-write shape had two
 * distinct races: a lost update when the row existed (both writers overwrote
 * the same row from the same stale read) and a phantom when it did not (two
 * first buys of a symbol both saw "no row" and both inserted).
 *
 * Neither needs an isolation-level change. UNIQUE (account_id, symbol) already
 * exists (migration 006), so ON CONFLICT DO UPDATE takes a row lock and
 * re-reads the conflicting row; and a plain UPDATE that blocks on a concurrent
 * writer re-evaluates its WHERE and SET against the new row version. Both are
 * atomic at READ COMMITTED.
 */
export async function updatePosition(params: UpdatePositionParams): Promise<void> {
  const sql = getDb()

  if (params.side === "buy") {
    const totalCost = params.quantity * params.price + params.commission + params.fees

    // New holding and add-to-existing are the same statement. In DO UPDATE,
    // positions.* is the committed post-lock row, so the weighted average is
    // computed against whatever the other writer just left behind.
    // realized_pnl is deliberately untouched: re-opening a closed position
    // keeps the P&L already banked on it.
    await sql`
      INSERT INTO positions (account_id, symbol, quantity, average_cost_basis, realized_pnl)
      VALUES (
        ${params.accountId}::int,
        ${params.symbol}::text,
        ${params.quantity}::numeric(16,6),
        (${totalCost}::numeric / ${params.quantity}::numeric)::numeric(16,6),
        0
      )
      ON CONFLICT (account_id, symbol) DO UPDATE
      SET quantity = positions.quantity + EXCLUDED.quantity,
          average_cost_basis =
            (positions.quantity * positions.average_cost_basis + ${totalCost}::numeric)
            / (positions.quantity + EXCLUDED.quantity),
          updated_at = NOW()
    `
  } else {
    // Sell — reduce quantity, realize P&L.
    //
    // LEAST clamps to the shares actually held, evaluated server-side against
    // the locked row rather than against a stale JS read. Every reference to
    // quantity and average_cost_basis in SET resolves against the pre-update
    // tuple, so the clamp and the P&L always agree with each other.
    //
    // quantity > 0 means a sell against a closed or missing position now
    // touches nothing. It previously still charged commission and fees to
    // realized_pnl for a trade that moved no shares.
    await sql`
      UPDATE positions
      SET quantity = quantity - LEAST(${params.quantity}::numeric, quantity),
          realized_pnl = realized_pnl
            + (${params.price}::numeric - average_cost_basis)
              * LEAST(${params.quantity}::numeric, quantity)
            - ${params.commission}::numeric - ${params.fees}::numeric,
          updated_at = NOW()
      WHERE account_id = ${params.accountId}::int
        AND symbol = ${params.symbol}::text
        AND quantity > 0
    `
  }

  invalidatePositions(params.accountId)
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
