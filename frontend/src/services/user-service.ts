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

/**
 * Best-effort lookup: a query failure is indistinguishable from a missing row,
 * both returning null. Only use this where null genuinely means "skip" — e.g.
 * proxy.ts's audit logging, which must never break a request. Anything that
 * turns null into a user-visible status wants findUserIdByAuth0Id instead.
 */
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
 * Same lookup, but a database failure throws instead of masquerading as a
 * missing user. Callers that map null to 403 onboarding_required need this:
 * swallowing here would tell an onboarded user to re-onboard on a Neon blip,
 * and the client redirect would strand them on a page that also needs the DB.
 */
export async function findUserIdByAuth0Id(auth0Id: string): Promise<number | null> {
  const sql = getDb()
  const rows = await sql`SELECT id FROM users WHERE auth0_id = ${auth0Id}`
  return rows[0]?.id ?? null
}

export async function isUserOnboarded(auth0Id: string): Promise<boolean> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT 1 FROM users
      WHERE auth0_id = ${auth0Id} AND onboarded_at IS NOT NULL
    `
    return rows.length > 0
  } catch {
    return false
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
