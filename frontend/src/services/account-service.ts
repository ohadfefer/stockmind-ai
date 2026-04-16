import { getDb } from "@/lib/db"

export type AccountDetails = {
  id: number
  account_number: string
  currency: string
  status: string
  running_balance: number
}

export type HistoryEntry = {
  type: "trade" | "cash_update"
  date: string
  action?: "buy" | "sell"
  quantity?: number
  symbol?: string
  price?: number
  pnl?: number | null
  principal: number
  commission?: number
  fees?: number
}

export async function getAccountHistory(accountId: number): Promise<HistoryEntry[]> {
  const sql = getDb()

  const [executions, cashUpdates] = await Promise.all([
    sql`
      SELECT id, symbol, side, quantity, price, commission, fees, executed_at
      FROM executions
      WHERE account_id = ${accountId}
      ORDER BY executed_at ASC
    `,
    sql`
      SELECT entry_type, amount, running_balance, description, created_at
      FROM cash_ledger
      WHERE account_id = ${accountId}
      ORDER BY created_at DESC
    `,
  ])

  // Track cost basis per symbol for P&L on sells
  const buyTotals = new Map<string, { totalCost: number; totalQty: number }>()
  const entries: HistoryEntry[] = []

  for (const exec of executions) {
    const qty = Number(exec.quantity)
    const price = Number(exec.price)
    const commission = Number(exec.commission)
    const fees = Number(exec.fees)
    let pnl: number | null = null

    if (exec.side === "buy") {
      const existing = buyTotals.get(exec.symbol as string) || { totalCost: 0, totalQty: 0 }
      existing.totalCost += qty * price
      existing.totalQty += qty
      buyTotals.set(exec.symbol as string, existing)
    } else if (exec.side === "sell") {
      const buyData = buyTotals.get(exec.symbol as string)
      if (buyData && buyData.totalQty > 0) {
        const avgBuyPrice = buyData.totalCost / buyData.totalQty
        pnl = (price - avgBuyPrice) * qty
      }
    }

    entries.push({
      type: "trade",
      date: exec.executed_at as string,
      action: exec.side as "buy" | "sell",
      quantity: qty,
      symbol: exec.symbol as string,
      price,
      pnl,
      principal: qty * price,
      commission,
      fees,
    })
  }

  for (const cu of cashUpdates) {
    entries.push({
      type: "cash_update",
      date: cu.created_at as string,
      principal: Number(cu.running_balance),
    })
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return entries
}

export async function getAccountDetails(userId: number): Promise<AccountDetails> {
  const sql = getDb()
  const accountId = await getOrCreateDefaultAccount(userId)

  const rows = await sql`
    SELECT a.id, a.account_number, a.currency, a.status,
           COALESCE(
             (SELECT running_balance FROM cash_ledger
              WHERE account_id = a.id ORDER BY created_at DESC LIMIT 1),
             0
           ) AS running_balance
    FROM accounts a
    WHERE a.id = ${accountId}
  `

  const row = rows[0]
  return {
    id: row.id as number,
    account_number: row.account_number as string,
    currency: row.currency as string,
    status: row.status as string,
    running_balance: Number(row.running_balance),
  }
}


export async function createDefaultAccount(userId: number): Promise<number> {
  const sql = getDb()
  const accountNumber = `SIM-${String(userId).padStart(5, "0")}`
  const created = await sql`
    INSERT INTO accounts (user_id, account_number)
    VALUES (${userId}, ${accountNumber})
    RETURNING id
  `
  const accountId = created[0].id as number

  await sql`
    INSERT INTO watchlists (account_id, name)
    VALUES (${accountId}, 'General')
  `

  return accountId
}

export async function getDefaultAccountId(userId: number): Promise<number | null> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT id FROM accounts WHERE user_id = ${userId} AND status = 'active'
      ORDER BY opened_at LIMIT 1
    `
    return rows[0]?.id ?? null
  } catch {
    return null
  }
}

/**
 * Returns the user's default account id, creating the account
 * and "General" watchlist if they don't exist yet.
 */
export async function getOrCreateDefaultAccount(userId: number): Promise<number> {
  const sql = getDb()

  // Try to find existing account
  const existing = await sql`
    SELECT id FROM accounts WHERE user_id = ${userId} AND status = 'active'
    ORDER BY opened_at LIMIT 1
  `
  if (existing.length > 0) return existing[0].id as number

  // Create account with human-readable number
  const accountNumber = `SIM-${String(userId).padStart(5, "0")}`
  const created = await sql`
    INSERT INTO accounts (user_id, account_number)
    VALUES (${userId}, ${accountNumber})
    RETURNING id
  `
  const accountId = created[0].id as number

  // Create default "General" watchlist
  await sql`
    INSERT INTO watchlists (account_id, name)
    VALUES (${accountId}, 'General')
  `

  return accountId
}
