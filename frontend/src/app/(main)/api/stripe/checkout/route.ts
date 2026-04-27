import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { createSubscriptionCheckoutSession } from "@/services/stripe/stripe-service"
import { getStripeCustomerIdByAuth0Id } from "@/services/user-service"
import { hasActiveSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"

export async function POST() {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = process.env.APP_BASE_URL
  if (!baseUrl) {
    console.error("APP_BASE_URL is not set")
    return NextResponse.json({ error: "APP_BASE_URL is not set" }, { status: 500 })
  }

  try {
    // Reject before creating a Checkout Session — otherwise Stripe charges
    // the card and the webhook upsert later trips on the partial unique
    // index, leaving two active subs in Stripe but only one in our DB.
    if (await hasActiveSubscriptionForAuth0Id(session.user.sub)) {
      return NextResponse.json(
        { error: "You already have an active subscription." },
        { status: 400 },
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
  } catch (err) {
    console.error("Failed to create Stripe checkout session", err)
    return NextResponse.json({ error: "Please try again." }, { status: 500 })
  }
}
