import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { PaymentsSettings } from "@/components/settings/payments"
import { getSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"
import {
  getDefaultPaymentMethod,
  listRecentInvoices,
  type InvoiceSummary,
  type PaymentMethodSummary,
} from "@/services/stripe/billing-service"

export default async function PaymentsSettingsPage() {
  const session = await auth0.getSession()
  if (!session) redirect("/auth/login")

  const subscription = await getSubscriptionForAuth0Id(session.user.sub)

  // Only Pro users with a Stripe Customer have a card / invoices to render.
  // Stripe outages must not 500 the settings page — degrade to a "—" UI and
  // leave the "Manage in portal" button working.
  let paymentMethod: PaymentMethodSummary | null = null
  let invoices: InvoiceSummary[] = []
  if (subscription?.plan === "pro" && subscription.stripeCustomerId) {
    const customerId = subscription.stripeCustomerId
    const subscriptionId = subscription.stripeSubscriptionId
    ;[paymentMethod, invoices] = await Promise.all([
      getDefaultPaymentMethod(customerId, subscriptionId).catch((err) => {
        console.error("payments page: failed to load default payment method", err)
        return null
      }),
      listRecentInvoices(customerId).catch((err) => {
        console.error("payments page: failed to list invoices", err)
        return [] as InvoiceSummary[]
      }),
    ])
  }

  return (
    <Suspense fallback={null}>
      <PaymentsSettings
        subscription={subscription}
        paymentMethod={paymentMethod}
        invoices={invoices}
      />
    </Suspense>
  )
}
