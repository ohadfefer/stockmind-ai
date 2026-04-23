import Stripe from "stripe"

let client: Stripe | null = null

function getStripeClient(): Stripe {
  if (client) return client
  const secretKey = process.env.SECRET_API_KEY
  if (!secretKey) {
    throw new Error("SECRET_API_KEY is not set in environment")
  }
  client = new Stripe(secretKey)
  return client
}

interface CreateSubscriptionCheckoutParams {
  baseUrl: string
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

  const session = await getStripeClient().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${params.baseUrl}/settings/payments?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.baseUrl}/settings/payments?status=canceled`,
    customer_email: params.customerEmail,
    client_reference_id: params.clientReferenceId,
    allow_promotion_codes: true,
  })

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL")
  }

  return session.url
}
