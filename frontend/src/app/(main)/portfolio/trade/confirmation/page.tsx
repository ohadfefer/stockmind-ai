"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { fetchQuote } from "@/actions/stock-data"
import { submitOrder } from "@/actions/orders"

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const action = searchParams.get("action") ?? "buy"
  const symbol = searchParams.get("symbol") ?? ""
  const quantity = searchParams.get("quantity") ?? "0"
  const type = searchParams.get("type") ?? "market"
  const estimatedValue = searchParams.get("estimatedValue")
  const filledAt = searchParams.get("filledAt") ?? new Date().toISOString()

  // Carry the submitted params back to the form so editing repopulates fields.
  const editHref = `/portfolio/trade?${searchParams.toString()}`

  if (!symbol) {
    router.replace("/portfolio/trade")
    return null
  }

  const details = [
    { label: "Action", value: action === "buy" ? "Buy" : "Sell" },
    { label: "Symbol", value: symbol },
    { label: "Quantity", value: `${quantity} shares` },
    { label: "Order Type", value: type.charAt(0).toUpperCase() + type.slice(1) },
    { label: "Estimated Value", value: estimatedValue ? `$${Number(estimatedValue).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "At market price" },
  ]

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      const quote = await fetchQuote(symbol)
      if (!quote || quote.c === 0) {
        setError("Unable to fetch current price. Please try again.")
        setSubmitting(false)
        return
      }

      await submitOrder({
        symbol,
        side: action as "buy" | "sell",
        orderType: type,
        quantity: Number(quantity),
        averageFillPrice: quote.c,
        filledAt,
      })

      router.push("/portfolio/orders")
    } catch {
      setError("Failed to submit order. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={editHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Order Form
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Confirm Order
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your order details before submitting
        </p>
      </div>

      <div className="mx-auto w-full max-w-lg rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-5">
          {/* Order Summary Header */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4">
            <CheckCircle2 className="size-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {action === "buy" ? "Buy" : "Sell"} {quantity} shares of{" "}
                <span className="font-mono text-primary">{symbol}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Market order — executes at current market price
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col divide-y divide-border">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-muted-foreground">
                  {d.label}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {d.value}
                </span>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              href={editHref}
              className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Edit Order
            </Link>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Submitting…" : "Confirm Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  )
}
