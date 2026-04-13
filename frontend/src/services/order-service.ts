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

export async function markOrderFilled(orderId: number, accountId: number, fillPrice: number): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE orders
    SET status = 'filled', filled_quantity = quantity, average_fill_price = ${fillPrice}, filled_at = NOW()
    WHERE id = ${orderId} AND account_id = ${accountId}
  `
}

export async function cancelOrder(orderId: number, accountId: number): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE orders
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE id = ${orderId} AND account_id = ${accountId} AND status = 'pending'
  `
}
