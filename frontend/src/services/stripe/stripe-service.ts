import Stripe from "stripe"

let client: Stripe | null = null

export function getStripeClient(): Stripe {
  if (client) return client
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not set in environment")
  }
  client = new Stripe(secretKey)
  return client
}

interface CreateSubscriptionCheckoutParams {
  baseUrl: string
  stripeCustomerId?: string
  customerEmail?: string
  clientReferenceId?: string
}

export async function createSubscriptionCheckoutSession(
  params: CreateSubscriptionCheckoutParams,
): Promise<string> {
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    throw new Error("STRIPE_PRICE_ID is not set in environment")
  }

  // Stripe rejects `customer` + `customer_email` together. Prefer the saved
  // Customer id so returning subscribers reuse their existing Stripe Customer
  // (and past invoices stay attached to it).
  const session = await getStripeClient().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${params.baseUrl}/settings/payments?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.baseUrl}/settings/payments?status=canceled`,
    customer: params.stripeCustomerId,
    customer_email: params.stripeCustomerId ? undefined : params.customerEmail,
    client_reference_id: params.clientReferenceId,
    allow_promotion_codes: true,
  })

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL")
  }

  return session.url
}
