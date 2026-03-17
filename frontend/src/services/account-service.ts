import { getDb } from "@/lib/db"

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
