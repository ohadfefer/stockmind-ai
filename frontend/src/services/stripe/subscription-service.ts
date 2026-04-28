import { revalidateTag, unstable_cache } from "next/cache"
import { getDb } from "@/lib/db"

// Cache tag for the per-user subscription view. Anything that mutates the
// `users.subscription_plan` or `subscriptions` row for a user must call
// revalidateTag(getSubscriptionCacheTag(auth0Id)) so the next request reads
// fresh data instead of the stale Next.js Data Cache entry.
export function getSubscriptionCacheTag(auth0Id: string): string {
  return `subscription:${auth0Id}`
}

export type SubscriptionType = "one_off" | "recurring"
export type PricingModel = "flat_rate" | "per_unit" | "tiered" | "usage_based"
export type BillingInterval = "day" | "week" | "month" | "year"

// Runtime array + derived type so callers can validate unknown strings
// against the same source of truth the DB CHECK constraint enforces.
export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export type UserSubscriptionPlan = "free" | "pro"

export interface UpsertSubscriptionParams {
  userId: number
  userPlan: UserSubscriptionPlan
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  stripeProductId: string | null
  plan: string
  type: SubscriptionType
  pricingModel: PricingModel
  billingInterval: BillingInterval | null
  unitAmount: number | null
  currency: string
  status: SubscriptionStatus
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  trialEnd: Date | null
  checkoutSessionId: string | null
}

// Writes the subscription row AND flips users.subscription_plan in a single
// transaction so the two can never drift — matters most for terminal events
// like customer.subscription.deleted, which Stripe does not re-send.
export async function upsertSubscription(
  p: UpsertSubscriptionParams,
): Promise<{ id: number }> {
  const sql = getDb()
  const results = await sql.transaction([
    sql`
      INSERT INTO subscriptions (
        user_id, stripe_customer_id, stripe_subscription_id,
        stripe_price_id, stripe_product_id,
        plan, type, pricing_model, billing_interval, unit_amount, currency,
        status, current_period_start, current_period_end,
        cancel_at_period_end, canceled_at, trial_end,
        checkout_session_id
      )
      VALUES (
        ${p.userId}, ${p.stripeCustomerId}, ${p.stripeSubscriptionId},
        ${p.stripePriceId}, ${p.stripeProductId},
        ${p.plan}, ${p.type}, ${p.pricingModel}, ${p.billingInterval}, ${p.unitAmount}, ${p.currency},
        ${p.status}, ${p.currentPeriodStart}, ${p.currentPeriodEnd},
        ${p.cancelAtPeriodEnd}, ${p.canceledAt}, ${p.trialEnd},
        ${p.checkoutSessionId}
      )
      ON CONFLICT (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL
      DO UPDATE SET
        stripe_price_id      = EXCLUDED.stripe_price_id,
        stripe_product_id    = EXCLUDED.stripe_product_id,
        plan                 = EXCLUDED.plan,
        type                 = EXCLUDED.type,
        pricing_model        = EXCLUDED.pricing_model,
        billing_interval     = EXCLUDED.billing_interval,
        unit_amount          = EXCLUDED.unit_amount,
        currency             = EXCLUDED.currency,
        status               = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end   = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        canceled_at          = EXCLUDED.canceled_at,
        trial_end            = EXCLUDED.trial_end,
        updated_at           = NOW()
      RETURNING id
    `,
    sql`
      UPDATE users
      SET subscription_plan = ${p.userPlan}, updated_at = NOW()
      WHERE id = ${p.userId}
    `,
  ])
  const insertRows = results[0] as { id: number }[]
  return { id: insertRows[0].id }
}

export async function setUserSubscriptionPlan(
  userId: number,
  plan: UserSubscriptionPlan,
): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE users
    SET subscription_plan = ${plan}, updated_at = NOW()
    WHERE id = ${userId}
  `
}

// Targeted UPDATE for the cancel-at-period-end flow. The webhook
// (customer.subscription.updated) will re-sync the same fields when Stripe
// echoes the change, so this is idempotent and safe under the race.
export async function markSubscriptionCancelAtPeriodEnd(
  stripeSubscriptionId: string,
  canceledAt: Date,
): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE subscriptions
    SET cancel_at_period_end = TRUE,
        canceled_at = ${canceledAt},
        updated_at = NOW()
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
  `
}

export async function setUserStripeCustomerId(
  userId: number,
  stripeCustomerId: string,
): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE users
    SET stripe_customer_id = ${stripeCustomerId}, updated_at = NOW()
    WHERE id = ${userId}
      AND (stripe_customer_id IS NULL OR stripe_customer_id = ${stripeCustomerId})
  `
}

export async function getUserIdByStripeCustomerId(
  stripeCustomerId: string,
): Promise<number | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id FROM users WHERE stripe_customer_id = ${stripeCustomerId}
  `
  return (rows[0]?.id as number) ?? null
}

export interface ActiveSubscriptionRow {
  plan: string
  status: SubscriptionStatus
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string
}

// Cheap server-side guard for /api/stripe/checkout so we reject a duplicate
// subscribe attempt BEFORE creating a Checkout Session — the partial unique
// index idx_subscriptions_user_active would catch it eventually, but only
// after Stripe has already charged the card.
export async function hasActiveSubscriptionForAuth0Id(
  auth0Id: string,
): Promise<boolean> {
  const sql = getDb()
  const rows = await sql`
    SELECT 1
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE u.auth0_id = ${auth0Id}
      AND s.status IN ('active', 'trialing', 'past_due')
    LIMIT 1
  `
  return rows.length > 0
}

export async function getActiveSubscriptionForUserId(
  userId: number,
): Promise<ActiveSubscriptionRow | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT plan, status, current_period_end, cancel_at_period_end, stripe_subscription_id
    FROM subscriptions
    WHERE user_id = ${userId}
      AND status IN ('active', 'trialing', 'past_due')
    ORDER BY created_at DESC
    LIMIT 1
  `
  if (!rows[0]) return null
  return {
    plan: rows[0].plan as string,
    status: rows[0].status as SubscriptionStatus,
    currentPeriodEnd: rows[0].current_period_end as Date | null,
    cancelAtPeriodEnd: rows[0].cancel_at_period_end as boolean,
    stripeSubscriptionId: rows[0].stripe_subscription_id as string,
  }
}

export interface UserSubscriptionView {
  plan: UserSubscriptionPlan
  status: SubscriptionStatus | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  unitAmount: number | null
  currency: string | null
  billingInterval: BillingInterval | null
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
}

// Returns the user's plan plus the active subscription's billing details in
// a single query keyed by auth0_id. `plan` comes from users.subscription_plan
// (the denormalized hot-path field); the LEFT JOIN supplies row-level details
// for Pro users and yields nulls for free users. The partial unique index
// idx_subscriptions_user_active guarantees at most one matching row per user.
//
// Wrapped in unstable_cache so the (main) layout doesn't pay a DB round-trip
// on every navigation. Invalidation is tag-driven via getSubscriptionCacheTag —
// the Stripe webhook and the cancel API call revalidateTag whenever the row
// changes, so the cached view stays in lock-step with truth.
export async function getSubscriptionForAuth0Id(
  auth0Id: string,
): Promise<UserSubscriptionView | null> {
  return unstable_cache(
    async (): Promise<UserSubscriptionView | null> => {
      const sql = getDb()
      const rows = await sql`
        SELECT
          u.subscription_plan,
          u.stripe_customer_id,
          s.status,
          s.current_period_end,
          s.cancel_at_period_end,
          s.unit_amount,
          s.currency,
          s.billing_interval,
          s.stripe_subscription_id
        FROM users u
        LEFT JOIN subscriptions s
          ON s.user_id = u.id
         AND s.status IN ('active', 'trialing', 'past_due')
        WHERE u.auth0_id = ${auth0Id}
        LIMIT 1
      `
      const row = rows[0]
      if (!row) return null
      return {
        plan: row.subscription_plan as UserSubscriptionPlan,
        status: (row.status as SubscriptionStatus | null) ?? null,
        currentPeriodEnd: (row.current_period_end as Date | null) ?? null,
        cancelAtPeriodEnd: (row.cancel_at_period_end as boolean | null) ?? false,
        unitAmount: (row.unit_amount as number | null) ?? null,
        currency: (row.currency as string | null) ?? null,
        billingInterval: (row.billing_interval as BillingInterval | null) ?? null,
        stripeSubscriptionId: (row.stripe_subscription_id as string | null) ?? null,
        stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
      }
    },
    ["subscription-by-auth0-id", auth0Id],
    // 60s ceiling on staleness if tag revalidation ever misses (failed
    // webhook delivery, transient revalidateTag throw). Plan changes are
    // rare so the extra DB hits are negligible; the TTL is just a safety
    // net behind the primary tag-based invalidation.
    { tags: [getSubscriptionCacheTag(auth0Id)], revalidate: 60 },
  )()
}

// Plan changes in the webhook only have a userId in scope. Resolve the
// auth0_id and revalidate the corresponding cache tag so the next read
// re-runs the query against the freshly-written row.
export async function revalidateSubscriptionByUserId(
  userId: number,
): Promise<void> {
  const sql = getDb()
  const rows = await sql`SELECT auth0_id FROM users WHERE id = ${userId}`
  const auth0Id = rows[0]?.auth0_id as string | undefined
  if (auth0Id) {
    // Next.js 16 requires a cache-life profile alongside the tag.
    revalidateTag(getSubscriptionCacheTag(auth0Id), "default")
  }
}
