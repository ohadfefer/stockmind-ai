"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { UserSubscriptionView } from "@/services/stripe/subscription-service"
import { FreePlan, type StatusMessage } from "./free-plan"
import { SubscriberPlan } from "./subscriber-plan"

function initialStatusFromUrl(result: string | null): StatusMessage {
  if (result === "success") {
    return { tone: "success", text: "Subscription started — welcome to StockMind Pro." }
  }
  if (result === "canceled") {
    return { tone: "info", text: "Checkout canceled. You can subscribe whenever you're ready." }
  }
  return null
}

interface PaymentsSettingsProps {
  subscription: UserSubscriptionView | null
}

export function PaymentsSettings({ subscription }: PaymentsSettingsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [urlStatus] = useState<StatusMessage>(() =>
    initialStatusFromUrl(searchParams.get("status")),
  )

  useEffect(() => {
    if (searchParams.get("status")) {
      router.replace("/settings/payments")
    }
  }, [searchParams, router])

  const isPro = subscription?.plan === "pro"

  return (
    <div className="flex flex-col gap-1">
      {isPro && subscription ? (
        <SubscriberPlan subscription={subscription} urlStatus={urlStatus} />
      ) : (
        <FreePlan urlStatus={urlStatus} />
      )}
    </div>
  )
}
