import type Stripe from "stripe"
import { getStripeClient } from "./stripe-service"
import { getUserIdByAuth0Id } from "../user-service"
import {
  getUserIdByStripeCustomerId,
  setUserStripeCustomerId,
  SUBSCRIPTION_STATUSES,
  upsertSubscription,
  type BillingInterval,
  type PricingModel,
  type SubscriptionStatus,
  type SubscriptionType,
  type UserSubscriptionPlan,
} from "./subscription-service"

export function constructStripeEvent(
  rawBody: string | Buffer,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set in environment")
  }
  return getStripeClient().webhooks.constructEvent(rawBody, signature, secret)
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      return
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionChanged(event.data.object as Stripe.Subscription)
      return
    default:
      return
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== "subscription") return

  const auth0Id = session.client_reference_id
  if (!auth0Id) {
    throw new Error("checkout.session.completed: missing client_reference_id")
  }
  const userId = await getUserIdByAuth0Id(auth0Id)
  if (!userId) {
    throw new Error(`checkout.session.completed: no user for auth0_id=${auth0Id}`)
  }

  const customerId = resolveId(session.customer)
  if (!customerId) {
    throw new Error("checkout.session.completed: missing customer id")
  }
  await setUserStripeCustomerId(userId, customerId)

  const subscriptionId = resolveId(session.subscription)
  if (!subscriptionId) {
    throw new Error("checkout.session.completed: missing subscription id")
  }

  const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  })

  await syncSubscription({
    userId,
    customerId,
    subscription,
    checkoutSessionId: session.id,
  })
}

async function handleSubscriptionChanged(subscription: Stripe.Subscription): Promise<void> {
  const customerId = resolveId(subscription.customer)
  if (!customerId) return

  const userId = await getUserIdByStripeCustomerId(customerId)
  if (!userId) {
    console.warn(
      `subscription event for unknown stripe_customer_id=${customerId} (id=${subscription.id})`,
    )
    return
  }

  await syncSubscription({
    userId,
    customerId,
    subscription,
    checkoutSessionId: null,
  })
}

interface SyncArgs {
  userId: number
  customerId: string
  subscription: Stripe.Subscription
  checkoutSessionId: string | null
}

async function syncSubscription(args: SyncArgs): Promise<void> {
  const { userId, customerId, subscription, checkoutSessionId } = args
  const item = subscription.items.data[0]
  if (!item) throw new Error(`subscription ${subscription.id} has no items`)
  const price = item.price

  const plan = derivePlanName(price)
  const status = normalizeStatus(subscription.status)
  const userPlan: UserSubscriptionPlan = grantsProAccess(status) ? "pro" : "free"

  await upsertSubscription({
    userId,
    userPlan,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: price.id,
    stripeProductId: resolveId(price.product),
    plan,
    type: mapType(price.type),
    pricingModel: derivePricingModel(price),
    billingInterval: (price.recurring?.interval as BillingInterval | undefined) ?? null,
    unitAmount: price.unit_amount,
    currency: (price.currency ?? "usd").toUpperCase(),
    status,
    currentPeriodStart: toDate(item.current_period_start),
    currentPeriodEnd: toDate(item.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: toDate(subscription.canceled_at),
    trialEnd: toDate(subscription.trial_end),
    checkoutSessionId,
  })
}

function resolveId(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null
  return typeof ref === "string" ? ref : ref.id
}

function toDate(unix: number | null | undefined): Date | null {
  if (!unix) return null
  return new Date(unix * 1000)
}

function mapType(priceType: Stripe.Price.Type): SubscriptionType {
  return priceType === "one_time" ? "one_off" : "recurring"
}

function derivePricingModel(price: Stripe.Price): PricingModel {
  if (price.billing_scheme === "tiered") return "tiered"
  if (price.recurring?.usage_type === "metered") return "usage_based"
  return "flat_rate"
}

function derivePlanName(price: Stripe.Price): string {
  const fromMetadata = price.metadata?.plan ?? price.metadata?.tier
  return (fromMetadata ?? "pro").toLowerCase()
}

// Stripe occasionally adds new subscription statuses. Validate against the
// known set so we never write a value the DB CHECK constraint will reject.
function normalizeStatus(raw: Stripe.Subscription.Status): SubscriptionStatus {
  if ((SUBSCRIPTION_STATUSES as readonly string[]).includes(raw)) {
    return raw as SubscriptionStatus
  }
  console.warn(
    `unknown stripe subscription status "${raw}", treating as "paused"`,
  )
  return "paused"
}

// Keep Pro access during dunning (past_due). Drop to free only when Stripe
// decisively ends access (canceled / unpaid / expired / incomplete).
function grantsProAccess(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing" || status === "past_due"
}
