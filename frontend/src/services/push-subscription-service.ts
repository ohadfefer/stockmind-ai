import { getDb } from "@/lib/db"

export type PushSubscriptionRecord = {
  id: number
  user_id: number
  endpoint: string
  p256dh: string
  auth: string
}

export async function saveSubscription(
  userId: number,
  endpoint: string,
  p256dh: string,
  auth: string,
) {
  const sql = getDb()
  await sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (${userId}, ${endpoint}, ${p256dh}, ${auth})
    ON CONFLICT (user_id, endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
  `
}

export async function deleteSubscription(userId: number, endpoint: string) {
  const sql = getDb()
  await sql`
    DELETE FROM push_subscriptions
    WHERE user_id = ${userId} AND endpoint = ${endpoint}
  `
}

export async function getSubscriptionsForUser(userId: number): Promise<PushSubscriptionRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, user_id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = ${userId}
  `
  return rows as unknown as PushSubscriptionRecord[]
}

export async function getSubscriptionsByUserIds(userIds: number[]): Promise<PushSubscriptionRecord[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, user_id, endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = ANY(${userIds})
  `
  return rows as unknown as PushSubscriptionRecord[]
}
