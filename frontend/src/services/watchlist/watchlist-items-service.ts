import { getDb } from "@/lib/db"

/**
 * Symbols in a watchlist, scoped to the owning account. The JOIN on
 * watchlists.account_id makes a foreign or guessed watchlistId return zero
 * rows instead of another account's tickers (prevents IDOR — CWE-639).
 */
export async function getWatchlistSymbolsById(
  watchlistId: number,
  accountId: number,
): Promise<string[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT wi.symbol
    FROM watchlist_items wi
    JOIN watchlists w ON w.id = wi.watchlist_id
    WHERE wi.watchlist_id = ${watchlistId}
      AND w.account_id = ${accountId}
    ORDER BY wi.symbol
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

