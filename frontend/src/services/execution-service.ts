import { getDb } from "@/lib/db"

export interface CreateExecutionParams {
  orderId: number
  accountId: number
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
}

export async function createExecution(params: CreateExecutionParams): Promise<number> {
  const sql = getDb()

  const rows = await sql`
    INSERT INTO executions (
      order_id, account_id, symbol, side, quantity, price, commission, fees
    ) VALUES (
      ${params.orderId}, ${params.accountId}, ${params.symbol}, ${params.side},
      ${params.quantity}, ${params.price}, 2.00, 0.50
    )
    RETURNING id
  `
  return rows[0].id as number
}
