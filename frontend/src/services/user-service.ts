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

export async function getUserName(auth0Id: string): Promise<string | null> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT full_name FROM users WHERE auth0_id = ${auth0Id}
    `
    return rows[0]?.full_name ?? null
  } catch {
    return null
  }
}
