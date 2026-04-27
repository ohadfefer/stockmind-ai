"use client"

import { Fragment, useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"
import clsx from "clsx"
import { Button } from "@/components/ui/button"
import { cancelSubscriptionAtPeriodEnd, startCustomerPortal } from "@/actions/stripe"
import type { UserSubscriptionView } from "@/services/stripe/subscription-service"
import type {
  InvoiceSummary,
  PaymentMethodSummary,
} from "@/services/stripe/billing-service"
import { CancelSubscriptionButton } from "./cancel-subscription-button"
import { longDateFormatter, shortDateFormatter } from "./formatters"
import type { StatusMessage } from "./free-plan"

interface SubscriberPlanProps {
  subscription: UserSubscriptionView
  paymentMethod: PaymentMethodSummary | null
  invoices: InvoiceSummary[]
  urlStatus: StatusMessage
}

function formatInterval(interval: UserSubscriptionView["billingInterval"]): string {
  switch (interval) {
    case "day":
      return "Daily"
    case "week":
      return "Weekly"
    case "month":
      return "Monthly"
    case "year":
      return "Yearly"
    default:
      return ""
  }
}

// Stripe brand values are snake_case identifiers, not display labels —
// e.g. "american_express", "union_pay", "visa", "unknown". Title-case each
// underscore-separated segment, and treat catch-all values as generic.
function formatCardBrand(brand: string): string {
  if (!brand || brand === "unknown" || brand === "other") return "Card"
  return brand
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function formatInvoiceTotal(totalInCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(totalInCents / 100)
}

function formatInvoiceStatus(status: InvoiceSummary["status"]): string {
  if (!status) return "—"
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function SubscriberPlan({
  subscription,
  paymentMethod,
  invoices,
  urlStatus,
}: SubscriberPlanProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function openPortal() {
    try {
      setIsLoading(true)
      setActionError(null)
      const { url } = await startCustomerPortal()
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : "Please try again."
      setActionError(`Could not open billing portal: ${detail}`)
    } finally {
      setIsLoading(false)
    }
  }

  // We don't rethrow — letting the dialog auto-close lets the status banner
  // below render the message. The page is then refreshed so the server
  // component re-fetches subscription state and re-renders the renewal copy
  // ("Your subscription will end on …").
  async function handleCancelSubscription() {
    try {
      setIsLoading(true)
      setActionError(null)
      await cancelSubscriptionAtPeriodEnd()
      router.refresh()
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : "Please try again."
      setActionError(`Could not cancel subscription: ${detail}`)
    } finally {
      setIsLoading(false)
    }
  }

  const intervalLabel = formatInterval(subscription.billingInterval)
  const renewalText = (() => {
    const end = subscription.currentPeriodEnd
    if (!end) return null
    const formatted = longDateFormatter.format(new Date(end))
    return subscription.cancelAtPeriodEnd
      ? `Your subscription will end on ${formatted}.`
      : `Your subscription will auto renew on ${formatted}.`
  })()

  const status: StatusMessage = actionError
    ? { tone: "error", text: actionError }
    : urlStatus

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-foreground">Pro plan</p>
          {intervalLabel && (
            <p className="text-sm text-foreground">{intervalLabel}</p>
          )}
          {renewalText && (
            <p className="text-sm text-muted-foreground">{renewalText}</p>
          )}
        </div>
        <Button variant="outline" onClick={openPortal} disabled={isLoading}>
          Adjust plan
        </Button>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground">Payment</h3>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-foreground">
            <CreditCard className="size-5 text-muted-foreground" />
            {paymentMethod ? (
              <span>
                {formatCardBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
              </span>
            ) : (
              <span className="text-muted-foreground">No card on file</span>
            )}
          </div>
          <Button variant="outline" onClick={openPortal} disabled={isLoading}>
            Update
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground">Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-x-6 gap-y-3 text-sm">
            <div className="text-muted-foreground">Date</div>
            <div className="text-muted-foreground">Total</div>
            <div className="text-muted-foreground">Status</div>
            <div className="text-muted-foreground">Actions</div>
            {invoices.map((invoice) => (
              <Fragment key={invoice.id}>
                <div className="text-foreground">
                  {shortDateFormatter.format(invoice.created)}
                </div>
                <div className="text-foreground">
                  {formatInvoiceTotal(invoice.total, invoice.currency)}
                </div>
                <div className="text-foreground">
                  {formatInvoiceStatus(invoice.status)}
                </div>
                {invoice.hostedUrl ? (
                  <a
                    href={invoice.hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="justify-self-start text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
                  >
                    View
                  </a>
                ) : (
                  <span className="justify-self-start text-muted-foreground">—</span>
                )}
              </Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground">Cancellation</h3>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-foreground">Cancel plan</p>
          <CancelSubscriptionButton
            currentPeriodEnd={subscription.currentPeriodEnd}
            onConfirm={handleCancelSubscription}
            disabled={isLoading || subscription.cancelAtPeriodEnd}
          />
        </div>
      </div>

      {status && (
        <p
          className={clsx(
            "text-xs",
            status.tone === "success" && "text-primary",
            status.tone === "error" && "text-destructive",
            status.tone === "info" && "text-muted-foreground",
          )}
        >
          {status.text}
        </p>
      )}
    </div>
  )
}
