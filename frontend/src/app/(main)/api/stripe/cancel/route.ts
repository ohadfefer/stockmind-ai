import { revalidateTag } from "next/cache"
import { withUser } from "@/lib/http/with-auth"
import { conflict, noContent } from "@/lib/http/problem"
import {
  getActiveSubscriptionForUserId,
  getSubscriptionCacheTag,
  markSubscriptionCancelAtPeriodEnd,
} from "@/services/stripe/subscription-service"
import { scheduleSubscriptionCancellation } from "@/services/stripe/cancellation-service"

/**
 * Cancels the caller's active subscription at the end of the current billing
 * period. Pro access is preserved until current_period_end; Stripe fires
 * customer.subscription.deleted at the period boundary which the webhook
 * converts into a plan downgrade. We also write back to subscriptions
 * immediately so the settings page re-renders with the new "ends on" copy
 * without waiting for the webhook round trip.
 *
 * Verb-in-path RPC like its checkout sibling, and kept for the same reason.
 *
 * Both outcomes are 204: an already-scheduled cancellation is the state the
 * caller asked for, so it is a success, not the 200 { alreadyScheduled }
 * discriminator the old handler returned — nothing read that field.
 */
export const POST = withUser(async (_request, { session, userId }) => {
  const sub = await getActiveSubscriptionForUserId(userId)
  if (!sub) {
    return conflict("no_active_subscription", "You have no active subscription to cancel.")
  }
  if (sub.cancelAtPeriodEnd) return noContent()

  const { canceledAt } = await scheduleSubscriptionCancellation(sub.stripeSubscriptionId)
  await markSubscriptionCancelAtPeriodEnd(sub.stripeSubscriptionId, canceledAt)

  // Local DB write happened ahead of the Stripe webhook echo — invalidate
  // the cached view so the settings page re-renders with the new "ends on"
  // copy on the very next request, not after the webhook round-trip.
  revalidateTag(getSubscriptionCacheTag(session.user.sub), "default")

  return noContent()
})
