import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { createSubscriptionCheckoutSession } from "@/services/stripe-service"

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
    const url = await createSubscriptionCheckoutSession({
      baseUrl,
      customerEmail: session.user.email ?? undefined,
      clientReferenceId: session.user.sub,
    })
    return NextResponse.json({ url })
  } catch (err) {
    console.error("Failed to create Stripe checkout session", err)
    const message = err instanceof Error ? err.message : "Failed to create checkout session"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
