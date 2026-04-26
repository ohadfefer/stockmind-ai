"use client"

import { Fragment, useState } from "react"
import { CreditCard } from "lucide-react"
import clsx from "clsx"
import { Button } from "@/components/ui/button"
import { startCustomerPortal } from "@/actions/stripe"
import type { UserSubscriptionView } from "@/services/stripe/subscription-service"
import type { StatusMessage } from "./free-plan"

interface SubscriberPlanProps {
  subscription: UserSubscriptionView
  urlStatus: StatusMessage
}

const MOCK_CARD_BRAND = "Visa"
const MOCK_CARD_LAST4 = "1234"

const MOCK_INVOICES = [
  { id: "inv_1", date: "Apr 26, 2026", total: "$20.00", status: "Paid" },
  { id: "inv_2", date: "Mar 26, 2026", total: "$20.00", status: "Paid" },
  { id: "inv_3", date: "Feb 26, 2026", total: "$20.00", status: "Paid" },
]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
})

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

export function SubscriberPlan({ subscription, urlStatus }: SubscriberPlanProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function openPortal() {
    try {
      setIsLoading(true)
      setActionError(null)
      const { url } = await startCustomerPortal()
      window.location.href = url
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : "Please try again."
      setActionError(`Could not open billing portal: ${detail}`)
      setIsLoading(false)
    }
  }

  const intervalLabel = formatInterval(subscription.billingInterval)
  const renewalText = (() => {
    const end = subscription.currentPeriodEnd
    if (!end) return null
    const formatted = dateFormatter.format(new Date(end))
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
            <span>
              {MOCK_CARD_BRAND} •••• {MOCK_CARD_LAST4}
            </span>
          </div>
          <Button variant="outline" onClick={openPortal} disabled={isLoading}>
            Update
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground">Invoices</h3>
        <div className="grid grid-cols-[1.5fr_1fr_1fr_auto] items-center gap-x-6 gap-y-3 text-sm">
          <div className="text-muted-foreground">Date</div>
          <div className="text-muted-foreground">Total</div>
          <div className="text-muted-foreground">Status</div>
          <div className="text-muted-foreground">Actions</div>
          {MOCK_INVOICES.map((invoice) => (
            <Fragment key={invoice.id}>
              <div className="text-foreground">{invoice.date}</div>
              <div className="text-foreground">{invoice.total}</div>
              <div className="text-foreground">{invoice.status}</div>
              <button
                type="button"
                onClick={openPortal}
                disabled={isLoading}
                className="justify-self-start text-foreground underline underline-offset-4 transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                View
              </button>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground">Cancellation</h3>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-foreground">Cancel plan</p>
          <Button variant="destructive" onClick={openPortal} disabled={isLoading}>
            Cancel
          </Button>
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
