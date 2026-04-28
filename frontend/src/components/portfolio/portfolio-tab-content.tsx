"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { PortfolioAnalyze, PortfolioAnalyzeSkeleton } from "./portfolio-analyze"
import { PortfolioTab } from "./portfolio-tab"
import { AlertsTab } from "@/components/alerts/alerts-tab"
import type { PortfolioTabKey } from "./portfolio-tabs-bar"
import type { PortfolioSummary } from "@/services/portfolio-service"
import type { StockAlert } from "@/services/alerts/alerts-service"
import type { PortfolioReview } from "@/services/ai/portfolio-review-service"

interface PortfolioTabContentProps {
  summary: PortfolioSummary
  alerts: StockAlert[]
  reviewPromise: Promise<PortfolioReview>
  isPro: boolean
}

export function PortfolioTabContent({
  summary,
  alerts,
  reviewPromise,
  isPro,
}: PortfolioTabContentProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as PortfolioTabKey) || "portfolio"

  if (activeTab === "analyze") {
    if (!isPro) {
      return <PortfolioAnalyze reviewPromise={reviewPromise} isPro={false} />
    }
    return (
      <Suspense fallback={<PortfolioAnalyzeSkeleton />}>
        <PortfolioAnalyze reviewPromise={reviewPromise} isPro />
      </Suspense>
    )
  }

  if (activeTab === "alerts") {
    return <AlertsTab alerts={alerts} />
  }

  return <PortfolioTab summary={summary} reviewPromise={reviewPromise} />
}
