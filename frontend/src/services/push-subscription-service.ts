import { getDb } from "@/lib/db"

export type PushSubscriptionRecord = {
  id: number
  account_id: number
  endpoint: string
  p256dh: string
  auth: string
}

export async function saveSubscription(
  accountId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
) {
  const sql = getDb()
  await sql`
    INSERT INTO push_subscriptions (account_id, endpoint, p256dh, auth)
    VALUES (${accountId}, ${endpoint}, ${p256dh}, ${auth})
    ON CONFLICT (account_id, endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
  `
}

export async function deleteSubscription(accountId: number, endpoint: string) {
  const sql = getDb()
  await sql`
    DELETE FROM push_subscriptions
    WHERE account_id = ${accountId} AND endpoint = ${endpoint}
  `
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
