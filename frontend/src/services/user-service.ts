import { getDb } from "@/lib/db"

export interface InsertUserParams {
  auth0Id: string
  email: string
  fullName: string
  imageUrl: string | null
}

/** The identity fields Settings > Basic Information reads and writes. */
export interface UserDetails {
  fullName: string
  email: string
}

/**
 * Trims and bounds a name the way onboarding always has, so the two writers of
 * users.full_name enforce one rule. Returns the cleaned name or the message to
 * hand back as 400 — an object either way, because both halves are strings.
 */
export function parseFullName(value: unknown): { fullName: string } | { error: string } {
  if (typeof value !== "string" || !value.trim()) return { error: "Full name is required" }
  const fullName = value.trim()
  if (fullName.length > 50) return { error: "Full name must be 50 characters or fewer" }
  return { fullName }
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

export async function getStripeCustomerIdByAuth0Id(
  auth0Id: string,
): Promise<string | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT stripe_customer_id FROM users WHERE auth0_id = ${auth0Id}
  `
  return (rows[0]?.stripe_customer_id as string | null) ?? null
}

function toUserDetails(row: Record<string, unknown> | undefined): UserDetails | null {
  if (!row) return null
  return {
    fullName: row.full_name as string,
    email: row.email as string,
  }
}

/**
 * Keyed on auth0_id rather than the numeric id: both columns live on the row
 * the session already identifies, so looking the id up first would be a second
 * HTTP round-trip to Neon for nothing.
 */
export async function getUserDetailsByAuth0Id(
  auth0Id: string,
): Promise<UserDetails | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT full_name, email FROM users WHERE auth0_id = ${auth0Id}
  `
  return toUserDetails(rows[0])
}

/**
 * Only full_name is writable here. email is the Auth0 identity the session is
 * keyed on and carries a UNIQUE constraint, so changing it belongs to the
 * identity provider, not a settings form.
 */
export async function updateUserFullName(
  userId: number,
  fullName: string,
): Promise<UserDetails | null> {
  const sql = getDb()
  const rows = await sql`
    UPDATE users
    SET full_name = ${fullName}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING full_name, email
  `
  return toUserDetails(rows[0])
}
