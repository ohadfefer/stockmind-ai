import { getDb } from "@/lib/db"
import type { WatchlistInfo } from "@/types/watchlist"

/**
 * Watchlist rows, scoped to the owning account.
 *
 * Every function here takes accountId from the session rather than deriving it
 * from a userId, because the caller (withAccount) has already resolved it —
 * re-deriving it per call cost an extra round trip on each one. Functions that
 * also take a watchlistId from the request scope on both, so a guessed or
 * foreign id matches zero rows instead of another account's list (CWE-639).
 */

/**
 * The account's oldest list — what "default" means everywhere.
 *
 * Deliberately not `WHERE name = 'General'`. Accounts are provisioned with a
 * list of that name, but nothing protects it: the tab bar offers Rename and
 * Delete on every list, so matching on the name meant the first rename left
 * /api/watchlists/default resolving to nothing and the Follow button 404ing
 * for good. Oldest-first also matches what watchlist-page-data, the dashboard
 * widget and the tab bar already treat as active, so there is now one
 * definition of "default" rather than two that agree until someone renames.
 *
 * Null only when the account has no lists at all.
 */
export async function getDefaultWatchlistId(accountId: number): Promise<number | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id FROM watchlists
    WHERE account_id = ${accountId}
    ORDER BY created_at, id
    LIMIT 1
  `
  return (rows[0]?.id as number | undefined) ?? null
}

export async function watchlistBelongsToAccount(
  watchlistId: number,
  accountId: number,
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    SELECT 1 FROM watchlists
    WHERE id = ${watchlistId} AND account_id = ${accountId}
  `
  return rows.length > 0
}

/**
 * Resolves the {id} path segment to a watchlist this account owns.
 *
 * "default" resolves to the General list so /details/[symbol] can follow a
 * stock without first fetching the list id. A malformed segment and a list
 * belonging to someone else both return null, and the routes collapse both
 * into one 404 — answering 403 for the latter would confirm the row exists.
 */
export async function resolveWatchlistId(
  idParam: string,
  accountId: number,
): Promise<number | null> {
  if (idParam === "default") return getDefaultWatchlistId(accountId)

  const id = Number(idParam)
  if (!Number.isInteger(id) || id <= 0) return null

  return (await watchlistBelongsToAccount(id, accountId)) ? id : null
}

/**
 * Every list on the account, each with its item count. Passing a symbol
 * annotates each row with containsSymbol rather than filtering the rows —
 * the picker renders unchecked boxes for lists that do not hold the symbol.
 */
export async function getWatchlists(
  accountId: number,
  symbol?: string,
): Promise<WatchlistInfo[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT w.id, w.name,
      COUNT(wi.id)::int AS item_count,
      COALESCE(BOOL_OR(wi.symbol = ${symbol ?? null}), false) AS contains_symbol
    FROM watchlists w
    LEFT JOIN watchlist_items wi ON wi.watchlist_id = w.id
    WHERE w.account_id = ${accountId}
    GROUP BY w.id, w.name, w.created_at
    ORDER BY w.created_at, w.id
  `
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    itemCount: r.item_count as number,
    ...(symbol ? { containsSymbol: r.contains_symbol as boolean } : {}),
  }))
}

export async function createWatchlist(accountId: number, name: string): Promise<number> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO watchlists (account_id, name)
    VALUES (${accountId}, ${name})
    RETURNING id
  `
  return rows[0].id as number
}

/** False when the list does not exist or is not this account's. */
export async function renameWatchlist(
  accountId: number,
  watchlistId: number,
  name: string,
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    UPDATE watchlists
    SET name = ${name}
    WHERE id = ${watchlistId} AND account_id = ${accountId}
    RETURNING id
  `
  return rows.length > 0
}

/**
 * False when the list does not exist or is not this account's.
 *
 * Items are not deleted here: watchlist_items.watchlist_id is ON DELETE
 * CASCADE (migration 010), so removing the list removes them. The previous
 * explicit `DELETE FROM watchlist_items WHERE watchlist_id = $1` was both
 * redundant and unscoped — it ran before the ownership-checked delete below,
 * so passing another account's id wiped their symbols and reported success.
 */
export async function deleteWatchlist(
  accountId: number,
  watchlistId: number,
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    DELETE FROM watchlists
    WHERE id = ${watchlistId} AND account_id = ${accountId}
    RETURNING id
  `
  return rows.length > 0
}
