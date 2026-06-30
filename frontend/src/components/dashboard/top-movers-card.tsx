"use client"

import { useMemo, useState } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { Holding } from "@/services/portfolio/portfolio-service"

type Range = "day" | "all"

interface TopMoversCardProps {
  holdings: Holding[]
  /** Overrides the default standalone-card container styling (border, bg, padding)
   *  so the card can be embedded as a section inside another card. */
  className?: string
  /** Tightens fonts/controls for narrow embedded layouts (e.g. the mobile KPI card). */
  compact?: boolean
}

export function TopMoversCard({
  holdings,
  className,
  compact = false,
}: TopMoversCardProps) {
  const [range, setRange] = useState<Range>("day")

  const valueOf = (h: Holding) =>
    range === "day" ? h.dayChangePercent : h.plPercent

  const { best, worst } = useMemo(() => {
    if (holdings.length === 0) return { best: null, worst: null }
    const sorted = [...holdings].sort((a, b) => valueOf(b) - valueOf(a))
    return { best: sorted[0], worst: sorted[sorted.length - 1] }
  }, [holdings, range])

  return (
    <div
      className={
        className ??
        "flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
      }
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={`font-medium text-muted-foreground ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          Top Movers
        </span>
        <div className="flex shrink-0 divide-x divide-border overflow-hidden rounded-md border border-border bg-card">
          {(["day", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`font-medium transition-colors ${
                compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
              } ${
                range === r
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "day" ? "Day" : compact ? "All" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {best && worst ? (
        <>
          <MoverRow
            holding={best}
            value={valueOf(best)}
            variant="up"
            compact={compact}
          />
          {best.ticker !== worst.ticker && (
            <MoverRow
              holding={worst}
              value={valueOf(worst)}
              variant="down"
              compact={compact}
            />
          )}
        </>
      ) : (
        <div
          className={`flex flex-1 items-center text-muted-foreground ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
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
  compact = false,
}: {
  holding: Holding
  value: number
  variant: "up" | "down"
  compact?: boolean
}) {
  const positive = value >= 0
  const color = positive ? "text-[#10B981]" : "text-[#EF4444]"
  const Icon = variant === "up" ? TrendingUp : TrendingDown
  const sign = value > 0 ? "+" : ""
  const textSize = compact ? "text-sm" : "text-base"

  return (
    <div className="flex items-center justify-between gap-1">
      <div className={`flex min-w-0 items-center ${compact ? "gap-1" : "gap-2"}`}>
        <Icon className={`shrink-0 ${compact ? "size-3.5" : "size-4"} ${color}`} />
        <span className={`truncate font-mono font-bold text-foreground ${textSize}`}>
          {holding.ticker}
        </span>
      </div>
      <span className={`shrink-0 font-mono font-semibold text-foreground ${textSize}`}>
        {sign}
        {value.toFixed(2)}%
      </span>
    </div>
  )
}
