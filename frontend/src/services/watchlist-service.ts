import { getDb } from "@/lib/db"
import { getOrCreateDefaultAccount } from "@/services/account-service"
import type { WatchlistInfo, WatchlistWithStatus } from "@/types/watchlist"

/**
 * Returns the "General" watchlist id for a user's default account.
 */
export async function getDefaultWatchlistId(userId: number): Promise<number> {
  const sql = getDb()
  const accountId = await getOrCreateDefaultAccount(userId)

  const rows = await sql`
    SELECT id FROM watchlists
    WHERE account_id = ${accountId} AND name = 'General'
    LIMIT 1
  `
  return rows[0].id as number
}

export async function getWatchlistSymbolsById(watchlistId: number): Promise<string[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT symbol FROM watchlist_items
    WHERE watchlist_id = ${watchlistId}
    ORDER BY symbol
  `
  return rows.map((r) => r.symbol as string)
}

export async function getUserWatchlistsWithCounts(userId: number): Promise<WatchlistInfo[]> {
  const sql = getDb()
  const accountId = await getOrCreateDefaultAccount(userId)

  const rows = await sql`
    SELECT w.id, w.name, COUNT(wi.id)::int AS stock_count
    FROM watchlists w
    LEFT JOIN watchlist_items wi ON wi.watchlist_id = w.id
    WHERE w.account_id = ${accountId}
    GROUP BY w.id, w.name, w.created_at
    ORDER BY w.created_at
  `
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    stockCount: r.stock_count as number,
  }))
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

export async function addToWatchlist(watchlistId: number, symbol: string): Promise<boolean> {
  const sql = getDb()
  try {
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

export async function removeFromWatchlist(watchlistId: number, symbol: string): Promise<boolean> {
  const sql = getDb()
  try {
    await sql`
      DELETE FROM watchlist_items
      WHERE watchlist_id = ${watchlistId} AND symbol = ${symbol}
    `
    return true
  } catch {
    return false
  }
}

export async function getUserWatchlistsForSymbol(
  userId: number,
  symbol: string
): Promise<WatchlistWithStatus[]> {
  const sql = getDb()
  const accountId = await getOrCreateDefaultAccount(userId)

  const rows = await sql`
    SELECT w.id, w.name,
      EXISTS (
        SELECT 1 FROM watchlist_items wi
        WHERE wi.watchlist_id = w.id AND wi.symbol = ${symbol}
      ) AS has_symbol
    FROM watchlists w
    WHERE w.account_id = ${accountId}
    ORDER BY w.created_at
  `
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    hasSymbol: r.has_symbol as boolean,
  }))
}
