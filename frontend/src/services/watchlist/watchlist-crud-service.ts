import { getDb } from "@/lib/db"
import { getOrCreateDefaultAccount } from "@/services/account/account-service"
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

export async function createWatchlist(userId: number, name: string): Promise<number> {
  const sql = getDb()
  const accountId = await getOrCreateDefaultAccount(userId)

  const rows = await sql`
    INSERT INTO watchlists (account_id, name)
    VALUES (${accountId}, ${name})
    RETURNING id
  `
  return rows[0].id as number
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

export async function renameWatchlist(userId: number, watchlistId: number, name: string): Promise<boolean> {
  const sql = getDb()
  const accountId = await getOrCreateDefaultAccount(userId)

  try {
    await sql`
      UPDATE watchlists
      SET name = ${name}
      WHERE id = ${watchlistId} AND account_id = ${accountId}
    `
    return true
  } catch {
    return false
  }
}

export async function deleteWatchlist(userId: number, watchlistId: number): Promise<boolean> {
  const sql = getDb()
  const accountId = await getOrCreateDefaultAccount(userId)

  try {
    await sql`
      DELETE FROM watchlist_items
      WHERE watchlist_id = ${watchlistId}
    `
    await sql`
      DELETE FROM watchlists
      WHERE id = ${watchlistId} AND account_id = ${accountId}
    `
    return true
  } catch {
    return false
  }
}
