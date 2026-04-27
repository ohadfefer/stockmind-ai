import { getStripeClient } from "./stripe-service"

// Schedules a cancellation that takes effect at current_period_end. The
// subscription stays active (and the user keeps Pro access) until then;
// Stripe will fire customer.subscription.deleted on the period end, which
// our webhook converts into a plan downgrade.
export async function scheduleSubscriptionCancellation(
  stripeSubscriptionId: string,
): Promise<{ canceledAt: Date }> {
  const updated = await getStripeClient().subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  })
  // Stripe sets canceled_at to the time of the cancel request even when
  // cancel_at_period_end is true. Fall back to "now" if it's missing so we
  // always record when the user asked to cancel.
  const canceledAt = updated.canceled_at
    ? new Date(updated.canceled_at * 1000)
    : new Date()
  return { canceledAt }
}
