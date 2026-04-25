import { NextRequest, NextResponse } from "next/server"
import {
  constructStripeEvent,
  handleStripeEvent,
} from "@/services/stripe/webhook-service"

// Stripe signs the raw request body; force the Node runtime so we can read it
// verbatim with request.text() instead of going through edge body parsing.
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    )
  }

  const rawBody = await request.text()

  let event
  try {
    event = constructStripeEvent(rawBody, signature)
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    await handleStripeEvent(event)
  } catch (err) {
    console.error(`Stripe webhook handler failed for ${event.type}`, err)
    // Returning 500 makes Stripe retry the event, which is what we want for
    // transient failures (e.g. DB hiccup) so we don't lose subscription state.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
