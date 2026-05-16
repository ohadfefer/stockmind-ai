"use client"

import { useMemo, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { Holding } from "@/services/portfolio/portfolio-service"

type Range = "day" | "all"

interface TopMoversCardProps {
  holdings: Holding[]
}

export function TopMoversCard({ holdings }: TopMoversCardProps) {
  const [range, setRange] = useState<Range>("day")

  const valueOf = (h: Holding) =>
    range === "day" ? h.dayChangePercent : h.plPercent

  const { best, worst } = useMemo(() => {
    if (holdings.length === 0) return { best: null, worst: null }
    const sorted = [...holdings].sort((a, b) => valueOf(b) - valueOf(a))
    return { best: sorted[0], worst: sorted[sorted.length - 1] }
  }, [holdings, range])

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Top Movers
        </span>
        <div className="flex rounded-md bg-muted p-0.5">
          {(["day", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "day" ? "Day" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {best && worst ? (
        <>
          <MoverRow holding={best} value={valueOf(best)} variant="up" />
          {best.ticker !== worst.ticker && (
            <MoverRow holding={worst} value={valueOf(worst)} variant="down" />
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center text-sm text-muted-foreground">
          No holdings yet
        </div>
      )}
    </div>
  )
}

function MoverRow({
  holding,
  value,
  variant,
}: {
  holding: Holding
  value: number
  variant: "up" | "down"
}) {
  const positive = value >= 0
  const color = positive ? "text-[#10B981]" : "text-[#EF4444]"
  const Icon = variant === "up" ? TrendingUp : TrendingDown
  const sign = value > 0 ? "+" : ""

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${color}`} />
        <span className="font-mono text-base font-bold text-foreground">
          {holding.ticker}
        </span>
      </div>
      <span className="font-mono text-base font-semibold text-foreground">
        {sign}
        {value.toFixed(2)}%
      </span>
    </div>
  )
}
