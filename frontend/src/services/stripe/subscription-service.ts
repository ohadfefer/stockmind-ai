import { getDb } from "@/lib/db"

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
