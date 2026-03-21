import { getDb } from "@/lib/db"

interface RecordTradeSettlementParams {
  accountId: number
  executionId: number
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  commission: number
  fees: number
}

export async function recordTradeSettlement(params: RecordTradeSettlementParams) {
  const sql = getDb()

  const tradeValue = params.quantity * params.price
  const totalCosts = params.commission + params.fees

  // Buy: cash leaves the account. Sell: cash enters the account.
  const amount =
    params.side === "buy"
      ? -(tradeValue + totalCosts)
      : tradeValue - totalCosts

  const description = `${params.side.toUpperCase()} ${params.quantity} ${params.symbol} @ $${params.price} (comm $${params.commission}, fees $${params.fees})`

  // Get the current running balance (latest ledger entry), default to 0
  const balanceRows = await sql`
    SELECT running_balance FROM cash_ledger
    WHERE account_id = ${params.accountId}
    ORDER BY created_at DESC
    LIMIT 1
  `
  const currentBalance = balanceRows.length > 0 ? Number(balanceRows[0].running_balance) : 0
  const newBalance = currentBalance + amount

  await sql`
    INSERT INTO cash_ledger (
      account_id, entry_type, amount, running_balance, reference_id, description
    ) VALUES (
      ${params.accountId}, 'trade_settlement', ${amount}, ${newBalance},
      ${params.executionId}, ${description}
    )
  `
}
