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

/**
 * Whether the symbol is in *any* of the user's lists — what the details page
 * shows on the Follow button. Read directly by the server component; there is
 * no endpoint for it, because a boolean is not a resource.
 */
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

/**
 * Adds a symbol to a list this account owns. True when a row was created,
 * false when it was already there — which is what lets PUT answer 201 vs 204
 * and take its idempotency from the protocol rather than application code.
 *
 * The EXISTS guard scopes the write to the account even though callers check
 * ownership first: zero rows here is ambiguous (not owned, or already
 * present), so the route's separate check is what produces the 404, and this
 * is the backstop that keeps a future caller from writing across accounts.
 */
export async function addToWatchlist(
  watchlistId: number,
  accountId: number,
  symbol: string,
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO watchlist_items (watchlist_id, symbol)
    SELECT ${watchlistId}, ${symbol}
    WHERE EXISTS (
      SELECT 1 FROM watchlists
      WHERE id = ${watchlistId} AND account_id = ${accountId}
    )
    ON CONFLICT (watchlist_id, symbol) DO NOTHING
    RETURNING id
  `
  return rows.length > 0
}

/** Removes a symbol from a list this account owns. A no-op otherwise. */
export async function removeFromWatchlist(
  watchlistId: number,
  accountId: number,
  symbol: string,
): Promise<void> {
  const sql = getDb()
  await sql`
    DELETE FROM watchlist_items wi
    USING watchlists w
    WHERE wi.watchlist_id = w.id
      AND w.id = ${watchlistId}
      AND w.account_id = ${accountId}
      AND wi.symbol = ${symbol}
  `
}
