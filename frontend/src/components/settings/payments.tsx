"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startSubscriptionCheckout } from "@/actions/stripe"

const features = [
  "AI research chatbot with unlimited questions",
  "AI-powered portfolio reviews",
  "Advanced analytics and market insights",
  "Priority support",
]

type StatusMessage = { tone: "success" | "info" | "error"; text: string } | null

function initialStatusFromUrl(result: string | null): StatusMessage {
  if (result === "success") {
    return { tone: "success", text: "Subscription started — welcome to StockMind Pro." }
  }
  if (result === "canceled") {
    return { tone: "info", text: "Checkout canceled. You can subscribe whenever you're ready." }
  }
  return null
}

export function PaymentsSettings() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<StatusMessage>(() =>
    initialStatusFromUrl(searchParams.get("status")),
  )

  useEffect(() => {
    if (searchParams.get("status")) {
      router.replace("/settings/payments")
    }
  }, [searchParams, router])

  async function handleSubscribe() {
    try {
      setIsLoading(true)
      setStatus(null)
      const { url } = await startSubscriptionCheckout()
      window.location.href = url
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : "Please try again."
      setStatus({ tone: "error", text: `Could not start checkout: ${detail}` })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold text-foreground">Payments</h2>
      <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">StockMind Pro</p>
              <p className="text-xs text-muted-foreground">AI tools for smarter investing</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">$10</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
        </div>

        <ul className="flex flex-col gap-2 border-t border-border pt-4">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>

        <Button onClick={handleSubscribe} disabled={isLoading} className="w-full">
          {isLoading ? "Redirecting to Stripe…" : "Subscribe"}
        </Button>

        {status && (
          <p
            className={
              status.tone === "success"
                ? "text-xs text-primary"
                : status.tone === "error"
                  ? "text-xs text-destructive"
                  : "text-xs text-muted-foreground"
            }
          >
            {status.text}
          </p>
        )}
      </div>
    </div>
  )
}
