import { type SqlTag } from "@/lib/db"

export interface CreateExecutionParams {
  orderId: number
  accountId: number
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  commission: number
  fees: number
}

/**
 * Records one fill. Runs on the caller's tag so it can commit with the ledger
 * entry and position move that depend on the id it returns.
 *
 * commission and fees are parameters rather than the literals that used to sit
 * in the VALUES list. The caller already had to know both numbers — it passes
 * them to the settlement and the position update — so hardcoding them here made
 * the same pair of figures true in two places, and only one of them was where
 * anyone would think to change it.
 */
export async function createExecution(
  sql: SqlTag,
  params: CreateExecutionParams,
): Promise<number> {
  const rows = await sql`
    INSERT INTO executions (
      order_id, account_id, symbol, side, quantity, price, commission, fees
    ) VALUES (
      ${params.orderId}, ${params.accountId}, ${params.symbol}, ${params.side},
      ${params.quantity}, ${params.price}, ${params.commission}, ${params.fees}
    )
    RETURNING id
  `
  return rows[0].id as number
}
