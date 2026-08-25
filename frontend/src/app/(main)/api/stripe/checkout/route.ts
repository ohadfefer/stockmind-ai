import { NextResponse } from "next/server"
import { withAuth } from "@/lib/http/with-auth"
import { conflict, internal } from "@/lib/http/problem"
import { createSubscriptionCheckoutSession } from "@/services/stripe/stripe-service"
import { getStripeCustomerIdByAuth0Id } from "@/services/user-service"
import { hasActiveSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"

/**
 * Verb-in-path RPC, kept as-is: there is no Checkout Session resource this app
 * owns — Stripe does — and the README carries a carve-out note for it.
 *
 * withAuth is enough: everything below keys off session.user.sub, and no users
 * row is read. A caller mid-signup with no row yet still gets a working
 * checkout, and the webhook resolves them by client_reference_id afterwards.
 */
export const POST = withAuth(async (_request, { session }) => {
  const baseUrl = process.env.APP_BASE_URL
  if (!baseUrl) {
    // Logged, not returned — the old 500 body named the missing variable.
    console.error("[stripe/checkout] APP_BASE_URL is not set")
    return internal()
  }

  // Reject before creating a Checkout Session — otherwise Stripe charges
  // the card and the webhook upsert later trips on the partial unique
  // index, leaving two active subs in Stripe but only one in our DB.
  if (await hasActiveSubscriptionForAuth0Id(session.user.sub)) {
    return conflict(
      "subscription_active",
      "You already have an active subscription.",
    )
  }

  const stripeCustomerId = await getStripeCustomerIdByAuth0Id(session.user.sub)
  const url = await createSubscriptionCheckoutSession({
    baseUrl,
    stripeCustomerId: stripeCustomerId ?? undefined,
    customerEmail: stripeCustomerId ? undefined : (session.user.email ?? undefined),
    clientReferenceId: session.user.sub,
  })
  return NextResponse.json({ url })
})
