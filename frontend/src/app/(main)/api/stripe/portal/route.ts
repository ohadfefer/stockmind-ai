import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { createCustomerPortalSession } from "@/services/stripe/customer-portal-service"
import { getStripeCustomerIdByAuth0Id } from "@/services/user-service"

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
    const stripeCustomerId = await getStripeCustomerIdByAuth0Id(session.user.sub)
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found. Subscribe first." },
        { status: 400 },
      )
    }
    const url = await createCustomerPortalSession({
      stripeCustomerId,
      returnUrl: `${baseUrl}/settings/payments`,
    })
    return NextResponse.json({ url })
  } catch (err) {
    console.error("Failed to create Stripe billing portal session", err)
    return NextResponse.json({ error: "Please try again." }, { status: 500 })
  }
}
