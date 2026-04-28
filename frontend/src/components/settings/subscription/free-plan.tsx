"use client"

import { useState } from "react"
import { Check, Crown, Leaf, Sparkles } from "lucide-react"
import clsx from "clsx"
import { Button } from "@/components/ui/button"
import { startSubscriptionCheckout } from "@/actions/stripe"

const proFeatures = [
  "AI research chatbot",
  "AI-powered portfolio reviews",
  "Advanced analytics and market insights",
  "Priority support",
]

const freeFeatures = [
  "Limited AI research questions",
  "Basic portfolio tracking",
  "Standard market data",
]

const maxFeatures = [
  "20x more usage than Pro",
  "Recommended for deep research",
  "Dedicated support",
]

export type StatusMessage = { tone: "success" | "info" | "error"; text: string } | null

interface FreePlanProps {
  urlStatus: StatusMessage
}

export function FreePlan({ urlStatus }: FreePlanProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleSubscribe() {
    try {
      setIsLoading(true)
      setActionError(null)
      const { url } = await startSubscriptionCheckout()
      window.location.href = url
    } catch (err) {
      console.error(err)
      const detail = err instanceof Error ? err.message : "Please try again."
      setActionError(`Could not start checkout: ${detail}`)
      setIsLoading(false)
    }
  }

  const status: StatusMessage = actionError
    ? { tone: "error", text: actionError }
    : urlStatus

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-3">
        <PlanCard
          icon={<Leaf className="size-5 text-primary" />}
          name="Free"
          tagline="Get started with the basics"
          price="$0"
          features={freeFeatures}
          action={
            <Button disabled className="w-full" variant="outline">
              Current plan
            </Button>
          }
        />

        <PlanCard
          icon={<Sparkles className="size-5 text-primary" />}
          name="StockMind Pro"
          tagline="AI tools for smarter investing"
          price="$10"
          features={proFeatures}
          featuresHeading="Everything in Free, plus:"
          action={
            <Button onClick={handleSubscribe} disabled={isLoading} className="w-full">
              {isLoading ? "Redirecting to Stripe…" : "Subscribe"}
            </Button>
          }
        />

        <PlanCard
          icon={<Crown className="size-5 text-primary" />}
          name="StockMind Max"
          tagline="For power users and deep research"
          price="$30"
          features={maxFeatures}
          featuresHeading="Everything in Pro, plus:"
          action={
            <Button disabled className="w-full" variant="outline">
              Coming soon
            </Button>
          }
        />
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

interface PlanCardProps {
  icon: React.ReactNode
  name: string
  tagline: string
  price: string
  features: string[]
  featuresHeading?: string
  action: React.ReactNode
}

function PlanCard({ icon, name, tagline, price, features, featuresHeading, action }: PlanCardProps) {
  return (
    <div className="flex min-h-[28rem] flex-col gap-6 rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            {icon}
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{tagline}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{price}</p>
          <p className="text-xs text-muted-foreground">per month</p>
        </div>
      </div>

      <div className="-mx-6 border-t border-border" />

      <div className="flex flex-1 flex-col gap-3">
        {featuresHeading && (
          <p className="text-sm font-medium text-muted-foreground">{featuresHeading}</p>
        )}
        <ul className="flex flex-col gap-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {action}
    </div>
  )
}
