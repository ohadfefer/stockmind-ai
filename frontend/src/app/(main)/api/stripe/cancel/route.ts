import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import {
  getActiveSubscriptionForUserId,
  getSubscriptionCacheTag,
  markSubscriptionCancelAtPeriodEnd,
} from "@/services/stripe/subscription-service"
import { scheduleSubscriptionCancellation } from "@/services/stripe/cancellation-service"

// Cancels the caller's active subscription at the end of the current billing
// period. Pro access is preserved until current_period_end; Stripe fires
// customer.subscription.deleted at the period boundary which the webhook
// converts into a plan downgrade. We also write back to subscriptions
// immediately so the settings page re-renders with the new "ends on" copy
// without waiting for the webhook round trip.
export async function POST() {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const sub = await getActiveSubscriptionForUserId(userId)
    if (!sub) {
      return NextResponse.json(
        { error: "No active subscription to cancel." },
        { status: 400 },
      )
    }
    if (sub.cancelAtPeriodEnd) {
      // Idempotent — already scheduled. No Stripe call needed.
      return NextResponse.json({ ok: true, alreadyScheduled: true })
    }

    const { canceledAt } = await scheduleSubscriptionCancellation(
      sub.stripeSubscriptionId,
    )
    await markSubscriptionCancelAtPeriodEnd(sub.stripeSubscriptionId, canceledAt)

    // Local DB write happened ahead of the Stripe webhook echo — invalidate
    // the cached view so the settings page re-renders with the new "ends on"
    // copy on the very next request, not after the webhook round-trip.
    revalidateTag(getSubscriptionCacheTag(session.user.sub), "default")

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Failed to cancel Stripe subscription", err)
    return NextResponse.json({ error: "Please try again." }, { status: 500 })
  }
}
