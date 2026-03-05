"use client"

import { useState } from "react"

const sectors = [
  { name: "Technology", change: "+2.45%", positive: true, size: 6 },
  { name: "Finance", change: "+1.12%", positive: true, size: 3 },
  { name: "Energy", change: "-3.1%", positive: false, size: 2 },
  { name: "Communication", change: "+1.8%", positive: true, size: 4 },
  { name: "Health", change: "+0.4%", positive: true, size: 2 },
  { name: "Consumer", change: "-0.8%", positive: false, size: 3 },
]

function getColor(positive: boolean, change: string) {
  const val = Math.abs(parseFloat(change))
  if (!positive) {
    if (val > 2) return "bg-[#B91C1C]"
    return "bg-[#991B1B]/80"
  }
  if (val > 2) return "bg-[#047857]"
  if (val > 1) return "bg-[#065F46]"
  return "bg-[#065F46]/70"
}

export function SectorHeatmap() {
  const [period, setPeriod] = useState<"1D" | "1W">("1W")

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Sector Heatmap
        </h2>
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-0.5">
          <button
            onClick={() => setPeriod("1D")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              period === "1D"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            1D
          </button>
          <button
            onClick={() => setPeriod("1W")}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
              period === "1W"
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            1W
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 grid-rows-3 gap-1.5" style={{ minHeight: 200 }}>
        {/* Technology - large block */}
        <div
          className={`col-span-3 row-span-2 flex flex-col justify-end rounded-lg p-3 ${getColor(
            sectors[0].positive,
            sectors[0].change
          )}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {sectors[0].name}
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {sectors[0].change}
          </span>
        </div>

        {/* Finance */}
        <div
          className={`col-span-2 row-span-2 flex flex-col justify-end rounded-lg p-3 ${getColor(
            sectors[1].positive,
            sectors[1].change
          )}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {sectors[1].name}
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {sectors[1].change}
          </span>
        </div>

        {/* Energy */}
        <div
          className={`col-span-1 row-span-2 flex flex-col justify-end rounded-lg p-3 ${getColor(
            sectors[2].positive,
            sectors[2].change
          )}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {sectors[2].name}
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {sectors[2].change}
          </span>
        </div>

        {/* Communication */}
        <div
          className={`col-span-3 row-span-1 flex flex-col justify-end rounded-lg p-3 ${getColor(
            sectors[3].positive,
            sectors[3].change
          )}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {sectors[3].name}
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {sectors[3].change}
          </span>
        </div>

        {/* Health */}
        <div
          className={`col-span-1 row-span-1 flex flex-col justify-end rounded-lg p-3 ${getColor(
            sectors[4].positive,
            sectors[4].change
          )}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {sectors[4].name}
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {sectors[4].change}
          </span>
        </div>

        {/* Consumer */}
        <div
          className={`col-span-2 row-span-1 flex flex-col justify-end rounded-lg p-3 ${getColor(
            sectors[5].positive,
            sectors[5].change
          )}`}
        >
          <span className="text-sm font-semibold text-foreground">
            {sectors[5].name}
          </span>
          <span className="font-mono text-xs text-foreground/80">
            {sectors[5].change}
          </span>
        </div>
      </div>
    </div>
  )
}
