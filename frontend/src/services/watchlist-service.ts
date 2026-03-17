import { getDb } from "@/lib/db"
import { getOrCreateDefaultAccount } from "@/services/account-service"

export async function getUserIdByAuth0Id(auth0Id: string): Promise<number | null> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT id FROM users WHERE auth0_id = ${auth0Id}`
    return rows[0]?.id ?? null
  } catch {
    return null
  }
}

/**
 * Returns the "General" watchlist id for a user's default account.
 */
async function getDefaultWatchlistId(userId: number): Promise<number> {
  const sql = getDb()
  const accountId = await getOrCreateDefaultAccount(userId)

  const rows = await sql`
    SELECT id FROM watchlists
    WHERE account_id = ${accountId} AND name = 'General'
    LIMIT 1
  `
  return rows[0].id as number
}

export async function getWatchlistSymbols(userId: number): Promise<string[]> {
  const sql = getDb()
  try {
    const watchlistId = await getDefaultWatchlistId(userId)
    const rows = await sql`
      SELECT symbol FROM watchlist_items
      WHERE watchlist_id = ${watchlistId}
      ORDER BY symbol
    `
    return rows.map((r) => r.symbol as string)
  } catch {
    return []
  }
}

export async function isFollowing(userId: number, symbol: string): Promise<boolean> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT 1 FROM watchlist_items wi
      JOIN watchlists w ON w.id = wi.watchlist_id
      JOIN accounts a ON a.id = w.account_id
      WHERE a.user_id = ${userId} AND wi.symbol = ${symbol}
    `
    return rows.length > 0
  } catch {
    return false
  }
}

export async function addToWatchlist(userId: number, symbol: string): Promise<boolean> {
  const sql = getDb()
  try {
    const watchlistId = await getDefaultWatchlistId(userId)
    await sql`
      INSERT INTO watchlist_items (watchlist_id, symbol)
      VALUES (${watchlistId}, ${symbol})
      ON CONFLICT (watchlist_id, symbol) DO NOTHING
    `
    return true
  } catch {
    return false
  }
}

export async function removeFromWatchlist(userId: number, symbol: string): Promise<boolean> {
  const sql = getDb()
  try {
    const watchlistId = await getDefaultWatchlistId(userId)
    await sql`
      DELETE FROM watchlist_items
      WHERE watchlist_id = ${watchlistId} AND symbol = ${symbol}
    `
    return true
  } catch {
    return false
  }
}
