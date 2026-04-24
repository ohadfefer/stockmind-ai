import { getDb } from "@/lib/db"

export interface InsertUserParams {
  auth0Id: string
  email: string
  fullName: string
  imageUrl: string | null
}

export async function insertUser(
  params: InsertUserParams,
): Promise<{ userId: number; wasCreated: boolean }> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO users (auth0_id, email, full_name, image_url)
    VALUES (${params.auth0Id}, ${params.email}, ${params.fullName}, ${params.imageUrl})
    ON CONFLICT (auth0_id) DO UPDATE
    SET full_name = ${params.fullName}, updated_at = NOW()
    RETURNING id, (xmax = 0) AS was_created
  `
  return {
    userId: rows[0].id as number,
    wasCreated: rows[0].was_created as boolean,
  }
}

export async function getUserIdByAuth0Id(auth0Id: string): Promise<number | null> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT id FROM users WHERE auth0_id = ${auth0Id}`
    return rows[0]?.id ?? null
  } catch {
    return null
  }
}

export async function getStripeCustomerIdByAuth0Id(
  auth0Id: string,
): Promise<string | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT stripe_customer_id FROM users WHERE auth0_id = ${auth0Id}
  `
  return (rows[0]?.stripe_customer_id as string | null) ?? null
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
