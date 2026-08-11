import { getDb } from "@/lib/db"

export interface CreateOrderParams {
  accountId: number
  symbol: string
  side: "buy" | "sell"
  orderType: "market" | "limit" | "stop" | "stop_limit"
  quantity: number
  averageFillPrice: number
  filledAt: string
}

export interface Order {
  id: number
  symbol: string
  side: string
  order_type: string
  quantity: number
  time_in_force: string
  status: string
  average_fill_price: number | null
  submitted_at: string
}

export async function getOrdersByAccountId(accountId: number): Promise<Order[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, symbol, side, order_type, quantity, time_in_force,
           status, average_fill_price, submitted_at
    FROM orders
    WHERE account_id = ${accountId} AND status = 'pending'
    ORDER BY submitted_at DESC
  `
  return rows as unknown as Order[]
}

export async function createOrder(params: CreateOrderParams): Promise<number> {
  const sql = getDb()

  const rows = await sql`
    INSERT INTO orders (
      account_id, symbol, side, order_type, quantity,
      average_fill_price, filled_at
    ) VALUES (
      ${params.accountId}, ${params.symbol}, ${params.side}, ${params.orderType},
      ${params.quantity}, ${params.averageFillPrice}, ${params.filledAt}
    )
    RETURNING id
  `
  return rows[0].id as number
}

/** A pending order's authoritative trade terms, read from the order row. */
export interface OrderTerms {
  symbol: string
  side: "buy" | "sell"
  quantity: number
}

/**
 * Reads a pending order the account owns, for pricing before it is claimed.
 * Returns null if the order does not exist, is not this account's, or has
 * already been executed or cancelled.
 */
export async function getPendingOrder(
  orderId: number,
  accountId: number,
): Promise<OrderTerms | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT symbol, side, quantity FROM orders
    WHERE id = ${orderId} AND account_id = ${accountId} AND status = 'pending'
  `
  if (rows.length === 0) return null
  return {
    symbol: rows[0].symbol as string,
    side: rows[0].side as "buy" | "sell",
    quantity: Number(rows[0].quantity),
  }
}

/**
 * Atomically claims a pending order for execution, returning its trade terms.
 *
 * Two guarantees, both from this one statement:
 *
 * 1. The `status = 'pending'` predicate makes it a compare-and-set, so only one
 *    caller can move an order out of pending. Replaying the same orderId
 *    settles it once instead of minting a fresh execution per request.
 * 2. RETURNING supplies symbol, side and quantity from the order row, so the
 *    caller settles the terms the order was actually placed with rather than
 *    whatever the request body claimed.
 *
 * Deliberately marks the order filled *before* the money moves. The reverse
 * order risks settling one order twice, which duplicates cash; this way a crash
 * mid-settlement leaves a filled order with no ledger row — visible to the
 * invariant checker and repairable. Neither is ideal: the real fix is a single
 * transaction spanning the whole pipeline, tracked separately.
 */
export async function claimPendingOrder(
  orderId: number,
  accountId: number,
  fillPrice: number,
): Promise<OrderTerms | null> {
  const sql = getDb()
  const rows = await sql`
    UPDATE orders
    SET status = 'filled',
        filled_quantity = quantity,
        average_fill_price = ${fillPrice},
        filled_at = NOW()
    WHERE id = ${orderId} AND account_id = ${accountId} AND status = 'pending'
    RETURNING symbol, side, quantity
  `
  if (rows.length === 0) return null
  return {
    symbol: rows[0].symbol as string,
    side: rows[0].side as "buy" | "sell",
    quantity: Number(rows[0].quantity),
  }
}

export async function cancelOrder(orderId: number, accountId: number): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE orders
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE id = ${orderId} AND account_id = ${accountId} AND status = 'pending'
  `
}
