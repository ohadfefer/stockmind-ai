"use client"

import { PortfolioGraph } from "@/components/portfolio/portfolio-graph"
import { PortfolioHeatmapGrid } from "@/components/portfolio/portfolio-heatmap-grid"
import type { PortfolioDailyValue } from "@/services/position/portfolio-daily-value-service"

interface AccountPerformanceProps {
  dailyValues: PortfolioDailyValue[]
}

export function AccountPerformance({ dailyValues }: AccountPerformanceProps) {
  return (
    <div className="space-y-4">
      <PortfolioGraph dailyValues={dailyValues} />
      <PortfolioHeatmapGrid dailyValues={dailyValues} />
    </div>
  )
}
