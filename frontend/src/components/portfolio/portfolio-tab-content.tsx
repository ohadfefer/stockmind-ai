"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import { PortfolioAnalyze, PortfolioAnalyzeSkeleton } from "./portfolio-analyze"
import { PortfolioTab, PortfolioTabSkeleton } from "./portfolio-tab"
import { AlertsTab, AlertsTabSkeleton } from "@/components/alerts/alerts-tab"
import type { PortfolioTabKey } from "./portfolio-tabs-bar"
import type { PortfolioSummary } from "@/services/portfolio/portfolio-service"
import type { StockAlert } from "@/services/alerts/alerts-service"
import type { PortfolioReview } from "@/services/ai/portfolio-review-service"

interface PortfolioTabContentProps {
  summaryPromise: Promise<PortfolioSummary>
  alertsPromise: Promise<StockAlert[]>
  reviewPromise: Promise<PortfolioReview>
}

export function PortfolioTabContent({
  summaryPromise,
  alertsPromise,
  reviewPromise,
}: PortfolioTabContentProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as PortfolioTabKey) || "portfolio"

  if (activeTab === "analyze") {
    return (
      <ErrorBoundary
        resetKeys={[reviewPromise]}
        fallback={
          <SectionError
            title="Couldn't load analysis"
            description="We couldn't generate your portfolio analysis right now."
          />
        }
      >
        <Suspense fallback={<PortfolioAnalyzeSkeleton />}>
          <PortfolioAnalyze reviewPromise={reviewPromise} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  if (activeTab === "alerts") {
    return (
      <ErrorBoundary
        resetKeys={[alertsPromise]}
        fallback={
          <SectionError
            title="Couldn't load alerts"
            description="We couldn't fetch your alerts right now."
          />
        }
      >
        <Suspense fallback={<AlertsTabSkeleton />}>
          <AlertsTab alertsPromise={alertsPromise} />
        </Suspense>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary
      resetKeys={[summaryPromise]}
      fallback={
        <SectionError
          title="Couldn't load portfolio"
          description="We couldn't fetch your holdings right now."
        />
      }
    >
      <Suspense fallback={<PortfolioTabSkeleton />}>
        <PortfolioTab summaryPromise={summaryPromise} reviewPromise={reviewPromise} />
      </Suspense>
    </ErrorBoundary>
  )
}
