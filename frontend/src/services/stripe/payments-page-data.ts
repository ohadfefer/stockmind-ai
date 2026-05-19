import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import {
  getSubscriptionForAuth0Id,
  type UserSubscriptionView,
} from "@/services/stripe/subscription-service"
import {
  getDefaultPaymentMethod,
  listRecentInvoices,
  type InvoiceSummary,
  type PaymentMethodSummary,
} from "@/services/stripe/billing-service"

export interface PaymentsData {
  subscription: UserSubscriptionView | null
  paymentMethod: PaymentMethodSummary | null
  invoices: InvoiceSummary[]
}

export interface PaymentsPageData {
  dataPromise: Promise<PaymentsData>
}

// Logs with context then rethrows so the promise still rejects and the
// section error boundary renders a retryable state. This applies only to the
// subscription read (our own DB): a failure there previously 500'd the whole
// page, so a retryable section is a strict improvement. Stripe billing calls
// are deliberately NOT rethrown — see the inline degradation below.
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

/**
 * Resolves the payments page's only blocking concern — the auth redirect —
 * then hands back the subscription + billing data as a streamable promise so
 * the settings shell paints before Stripe responds.
 *
 * Like the conversation loader this is async: the unauthenticated redirect is
 * a security boundary that must run during the server render, not inside a
 * streamed promise. Everything after the session check streams.
 *
 * Failure policy is intentionally split: the subscription read (our DB)
 * rejects so the error boundary can retry, while the Stripe billing calls
 * degrade to "—" (null / []) exactly as before — a Stripe outage must not
 * take down the settings page or the "Manage in portal" button.
 */
export async function loadPaymentsPageData(): Promise<PaymentsPageData> {
  const session = await auth0.getSession()
  if (!session) redirect("/auth/login")
  const auth0Id = session.user.sub

  const subscriptionPromise = getSubscriptionForAuth0Id(auth0Id).catch(
    logAndRethrow("payments subscription failed"),
  )

  const dataPromise = subscriptionPromise.then(async (subscription) => {
    // Only Pro users with a Stripe Customer have a card / invoices to render.
    if (subscription?.plan === "pro" && subscription.stripeCustomerId) {
      const customerId = subscription.stripeCustomerId
      const subscriptionId = subscription.stripeSubscriptionId
      const [paymentMethod, invoices] = await Promise.all([
        getDefaultPaymentMethod(customerId, subscriptionId).catch((err) => {
          console.error(
            "payments page: failed to load default payment method",
            err,
          )
          return null
        }),
        listRecentInvoices(customerId).catch((err) => {
          console.error("payments page: failed to list invoices", err)
          return [] as InvoiceSummary[]
        }),
      ])
      return { subscription, paymentMethod, invoices }
    }
    return {
      subscription,
      paymentMethod: null,
      invoices: [] as InvoiceSummary[],
    }
  })

  return { dataPromise }
}
