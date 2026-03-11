import { getDb } from "@/lib/db"

export async function getUserIdByAuth0Id(auth0Id: string): Promise<number | null> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT id FROM users WHERE auth0_id = ${auth0Id}`
    return rows[0]?.id ?? null
  } catch {
    return null
  }
}

export async function getWatchlistSymbols(userId: number): Promise<string[]> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT symbol FROM watchlist WHERE user_id = ${userId} ORDER BY symbol`
    return rows.map((r) => r.symbol as string)
  } catch {
    return []
  }
}

export async function isFollowing(userId: number, symbol: string): Promise<boolean> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT 1 FROM watchlist WHERE user_id = ${userId} AND symbol = ${symbol}
    `
    return rows.length > 0
  } catch {
    return false
  }
}

export async function addToWatchlist(userId: number, symbol: string): Promise<boolean> {
  const sql = getDb()
  try {
    await sql`
      INSERT INTO watchlist (user_id, symbol)
      VALUES (${userId}, ${symbol})
      ON CONFLICT (user_id, symbol) DO NOTHING
    `
    return true
  } catch {
    return false
  }
}

export async function removeFromWatchlist(userId: number, symbol: string): Promise<boolean> {
  const sql = getDb()
  try {
    await sql`
      DELETE FROM watchlist WHERE user_id = ${userId} AND symbol = ${symbol}
    `
    return true
  } catch {
    return false
  }
}
