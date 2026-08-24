import { getDb } from "@/lib/db"

export type PushSubscriptionRecord = {
  id: number
  account_id: number
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Upserts the subscription and reports whether the row was new, so PUT can
 * answer 201 for a create and 204 for an overwrite.
 *
 * `xmax = 0` is the standard way to tell the two branches of an ON CONFLICT
 * apart: a freshly inserted tuple has no deleting transaction, so xmax is
 * zero, while the update branch takes a row lock on the conflicting tuple and
 * carries a non-zero xmax through to the returned version. It reads as an
 * internals trick because it is one; the alternatives are a second round trip
 * (racy) or comparing created_at against statement_timestamp() (couples the
 * check to a column default that could be dropped without anyone noticing).
 */
export async function saveSubscription(
  accountId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
): Promise<{ created: boolean }> {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO push_subscriptions (account_id, endpoint, p256dh, auth)
    VALUES (${accountId}, ${endpoint}, ${p256dh}, ${auth})
    ON CONFLICT (account_id, endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
    RETURNING (xmax = 0) AS created
  `
  return { created: Boolean(rows[0]?.created) }
}

/**
 * Returns whether a row was actually removed. DELETE answers 204 either way —
 * it is idempotent — but the audit log must not record a notifications-off
 * event for a subscription that was never registered.
 */
export async function deleteSubscription(
  accountId: number,
  endpoint: string,
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    DELETE FROM push_subscriptions
    WHERE account_id = ${accountId} AND endpoint = ${endpoint}
    RETURNING id
  `
  return rows.length > 0
}

/**
 * Existence check for GET, kept separate from getSubscriptionsForAccount so
 * the route that only needs a boolean never pulls p256dh and auth — the two
 * fields that let anyone holding them push to the device — into memory.
 */
export async function subscriptionExists(
  accountId: number,
  endpoint: string,
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    SELECT 1 FROM push_subscriptions
    WHERE account_id = ${accountId} AND endpoint = ${endpoint}
  `
  return rows.length > 0
}

export async function deleteSubscriptionById(id: number) {
  const sql = getDb()
  await sql`DELETE FROM push_subscriptions WHERE id = ${id}`
}

export async function getSubscriptionsForAccount(accountId: number): Promise<PushSubscriptionRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, account_id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE account_id = ${accountId}
  `
  return rows as unknown as PushSubscriptionRecord[]
}

export async function getSubscriptionsByAccountIds(accountIds: number[]): Promise<PushSubscriptionRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, account_id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE account_id = ANY(${accountIds})
  `
  return rows as unknown as PushSubscriptionRecord[]
}
