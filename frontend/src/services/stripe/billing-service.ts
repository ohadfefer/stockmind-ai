import type Stripe from "stripe"
import { getStripeClient } from "./stripe-service"

export interface PaymentMethodSummary {
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export interface InvoiceSummary {
  id: string
  created: Date
  total: number
  currency: string
  status: Stripe.Invoice.Status | null
  hostedUrl: string | null
  pdfUrl: string | null
}

// Stripe is the source of truth for billing artifacts (default PM, invoice
// history). They're only read on the low-traffic /settings/payments page, so
// we hit the API on demand instead of mirroring these into Postgres and
// subscribing to a half-dozen extra webhook events. The hot-path subscription
// state still lives in the `subscriptions` table — that's what gates Pro
// features and needs to be fast.

// Stripe Checkout (mode: subscription) attaches the card to the Customer and
// sets it as the Subscription's default_payment_method, but does NOT touch
// customer.invoice_settings.default_payment_method — that one only gets
// populated when the user later updates their card via the Customer Portal.
// So for the common case (a freshly-subscribed user) we have to look on the
// subscription, then fall back to the customer-level default, then to any
// attached card.
export async function getDefaultPaymentMethod(
  stripeCustomerId: string,
  stripeSubscriptionId: string | null,
): Promise<PaymentMethodSummary | null> {
  const stripe = getStripeClient()

  if (stripeSubscriptionId) {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
      expand: ["default_payment_method"],
    })
    const fromSub = toPaymentMethodSummary(sub.default_payment_method)
    if (fromSub) return fromSub
  }

  const customer = await stripe.customers.retrieve(stripeCustomerId, {
    expand: ["invoice_settings.default_payment_method"],
  })
  if (customer.deleted) return null
  const fromCustomer = toPaymentMethodSummary(
    customer.invoice_settings?.default_payment_method,
  )
  if (fromCustomer) return fromCustomer

  const list = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
    limit: 1,
  })
  return toPaymentMethodSummary(list.data[0])
}

function toPaymentMethodSummary(
  pm: Stripe.PaymentMethod | string | null | undefined,
): PaymentMethodSummary | null {
  if (!pm || typeof pm === "string" || !pm.card) return null
  // display_brand is more specific than brand (e.g. "american_express" vs
  // "amex", "union_pay" vs "unionpay") — prefer it when Stripe provides it.
  return {
    brand: pm.card.display_brand ?? pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
  }
}

export async function listRecentInvoices(
  stripeCustomerId: string,
  limit: number = 12,
): Promise<InvoiceSummary[]> {
  const result = await getStripeClient().invoices.list({
    customer: stripeCustomerId,
    limit,
  })
  return result.data
    .filter((inv): inv is Stripe.Invoice & { id: string } => Boolean(inv.id))
    .map((inv) => ({
      id: inv.id,
      created: new Date(inv.created * 1000),
      total: inv.total,
      currency: inv.currency,
      status: inv.status,
      hostedUrl: inv.hosted_invoice_url ?? null,
      pdfUrl: inv.invoice_pdf ?? null,
    }))
}
