import { getDb } from "@/lib/db"

export async function getWatchlistSymbolsById(watchlistId: number): Promise<string[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT symbol FROM watchlist_items
    WHERE watchlist_id = ${watchlistId}
    ORDER BY symbol
  `
  return rows.map((r) => r.symbol as string)
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

