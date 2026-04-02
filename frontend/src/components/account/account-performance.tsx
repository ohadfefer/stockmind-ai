"use client"

import { PortfolioGraph } from "@/components/portfolio/portfolio-graph"
import { PortfolioHeatmapGrid } from "@/components/portfolio/portfolio-heatmap-grid"
import type { PositionHistoryEntry } from "@/services/position/position-history-service"

interface AccountPerformanceProps {
  entries: PositionHistoryEntry[]
}

export function AccountPerformance({ entries }: AccountPerformanceProps) {
  return (
    <div className="space-y-4">
      <PortfolioGraph entries={entries} />
      <PortfolioHeatmapGrid entries={entries} />
    </div>
  )
}
