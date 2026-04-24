import { getStripeClient } from "./stripe-service"

interface CreatePortalSessionParams {
  stripeCustomerId: string
  returnUrl: string
}

export async function createCustomerPortalSession(
  params: CreatePortalSessionParams,
): Promise<string> {
  const session = await getStripeClient().billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  })

  if (!session.url) {
    throw new Error("Stripe did not return a billing portal URL")
  }

  return session.url
}
