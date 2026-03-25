"use client"

import { useState, useTransition } from "react"
import type { SectorPerformance } from "@/services/dashboard/sector-service"
import { fetchSectorPerformance } from "@/actions/sectors"

const gridClasses = [
  "col-span-3 row-span-2",
  "col-span-2 row-span-2",
  "col-span-1 row-span-2",
  "col-span-2 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-1 row-span-1",
  "col-span-2 row-span-1",
  "col-span-2 row-span-1",
  "col-span-1 row-span-1",
]

function getColor(change: number) {
  const val = Math.abs(change)
  if (change < 0) {
    if (val > 2) return "bg-[#B91C1C]"
    return "bg-[#991B1B]/80"
  }
  if (val > 2) return "bg-[#047857]"
  if (val > 1) return "bg-[#065F46]"
  return "bg-[#065F46]/70"
}

interface SectorHeatmapProps {
  initialData: SectorPerformance[]
}

export function SectorHeatmap({ initialData }: SectorHeatmapProps) {
  const [period, setPeriod] = useState<"1D" | "1W">("1D")
  const [sectors, setSectors] = useState(initialData)
  const [isPending, startTransition] = useTransition()

  function handlePeriodChange(newPeriod: "1D" | "1W") {
    if (newPeriod === period) return
    setPeriod(newPeriod)
    startTransition(async () => {
      const data = await fetchSectorPerformance(newPeriod)
      if (data) setSectors(data)
    })
  }

  const visible = sectors.slice(0, gridClasses.length)

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Sector Heatmap
        </h2>
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-0.5">
          <button
            onClick={() => handlePeriodChange("1D")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${period === "1D"
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            1D
          </button>
          <button
            onClick={() => handlePeriodChange("1W")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${period === "1W"
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            1W
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-6 grid-rows-4 gap-1.5 transition-opacity ${isPending ? "opacity-50" : ""}`}
        style={{ minHeight: 200 }}
      >
        {visible.map((s, i) => (
          <div
            key={s.sector}
            className={`${gridClasses[i]} flex flex-col justify-end rounded-lg p-3 ${getColor(s.averageChange)}`}
          >
            <span className="text-sm font-semibold text-foreground">
              {s.sector}
            </span>
            <span className="font-mono text-xs text-foreground/80">
              {s.averageChange >= 0 ? "+" : ""}
              {s.averageChange.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
