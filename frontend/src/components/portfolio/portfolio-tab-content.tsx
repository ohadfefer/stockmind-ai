"use client"

import { useSearchParams } from "next/navigation"
import { PortfolioAnalyze } from "./portfolio-analyze"
import { PortfolioTab } from "./portfolio-tab"
import { AlertsTab } from "@/components/alerts/alerts-tab"
import type { PortfolioTabKey } from "./portfolio-tabs-bar"
import type { PortfolioSummary } from "@/services/portfolio-service"
import type { StockAlert } from "@/services/alerts/alerts-service"

interface PortfolioTabContentProps {
  summary: PortfolioSummary
  alerts: StockAlert[]
}

export function PortfolioTabContent({ summary, alerts }: PortfolioTabContentProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as PortfolioTabKey) || "portfolio"

  if (activeTab === "analyze") {
    return <PortfolioAnalyze />
  }

  if (activeTab === "alerts") {
    return <AlertsTab alerts={alerts} />
  }

  return <PortfolioTab summary={summary} />
}
