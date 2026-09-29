"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

import type { PortfolioDailyValue } from "@/services/position/portfolio-daily-value-service"

interface PortfolioHeatmapGridProps {
  dailyValues: PortfolioDailyValue[]
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// The cell's local calendar date as YYYY-MM-DD. The grid is laid out in local
// dates, so the key must be too: toISOString() is UTC, which puts it a day
// early east of UTC and makes the (UTC) server render disagree with the
// browser's during hydration.
function toDateKey(date: Date): string {
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

function getReturnColor(returnPct: number | null): string {
  if (returnPct === null) return "#1A1D25" // muted — no data
  if (returnPct < -2) return "#EF4444" // red-500
  if (returnPct < 0) return "rgba(248, 113, 113, 0.5)" // red-400 at lower opacity
  if (returnPct === 0) return "#1A1D25" // muted
  if (returnPct <= 2) return "rgba(52, 211, 153, 0.5)" // emerald-400 at lower opacity
  return "#10B981" // emerald-500
}

interface DayData {
  date: string
  returnPct: number | null
  dollarChange: number | null
}

// The hovered day plus where to draw its tooltip, in px from the wrapper's
// edges. Exactly one of left/right is set.
interface HoverState {
  day: DayData
  left?: number
  right?: number
  bottom: number
}

const DAY_LABELS = ["", "M", "", "W", "", "F", ""]

export function PortfolioHeatmapGrid({ dailyValues }: PortfolioHeatmapGridProps) {
  const { dayData, weeks, monthLabels } = useMemo(() => {
    // Day-over-day return on total value, backing out external cash flows
    // (deposits/withdrawals) so they don't masquerade as gains/losses.
    const dailyReturns = new Map<string, { returnPct: number; dollarChange: number }>()
    for (let i = 1; i < dailyValues.length; i++) {
      const prev = dailyValues[i - 1]
      const curr = dailyValues[i]
      const dollarChange = curr.totalValue - prev.totalValue - curr.netCashFlow
      const returnPct = prev.totalValue > 0 ? (dollarChange / prev.totalValue) * 100 : 0
      dailyReturns.set(curr.date, { returnPct, dollarChange })
    }

    // Always show full year: Jan 1 – Dec 31
    const year = new Date().getFullYear()
    const jan1 = new Date(year, 0, 1)
    const dec31 = new Date(year, 11, 31)

    // Start from the Sunday on or before Jan 1
    const startDate = new Date(jan1)
    startDate.setDate(startDate.getDate() - startDate.getDay()) // Sunday = 0

    const allDays: DayData[] = []
    const monthLabelSet = new Map<number, string>()

    const currentDate = new Date(startDate)
    let weekIndex = 0

    // Go through Dec 31 and finish the final week
    while (currentDate <= dec31 || currentDate.getDay() !== 0) {
      const dateStr = toDateKey(currentDate)
      const dayOfWeek = currentDate.getDay() // Sunday = 0, Saturday = 6

      // Track month labels — place at the second week of each month, skip months outside the year
      if (currentDate.getDate() === 1 && currentDate.getFullYear() === year) {
        monthLabelSet.set(
          weekIndex + 1,
          currentDate.toLocaleDateString("en-US", { month: "short" }),
        )
      }

      const returnData = dailyReturns.get(dateStr)

      allDays.push({
        date: dateStr,
        returnPct: returnData?.returnPct ?? null,
        dollarChange: returnData?.dollarChange ?? null,
      })

      currentDate.setDate(currentDate.getDate() + 1)

      // Increment week after Saturday
      if (dayOfWeek === 6) {
        weekIndex++
      }

      // Safety break
      if (weekIndex > 60) break
    }

    return {
      // Whole weeks, Sunday to Saturday, so a cell's day is
      // dayData[weekIdx * 7 + dayIdx]
      dayData: allDays,
      // The loop always ends after a Saturday, which already advanced weekIndex
      weeks: weekIndex,
      monthLabels: Array.from(monthLabelSet.entries()).map(([week, label]) => ({ week, label })),
    }
  }, [dailyValues])

  const wrapperRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<HoverState | null>(null)

  // Clear hover when the layout resizes — the cached position goes stale.
  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setHover(null))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Built once per data change, so a hover re-renders only the tooltip, not
  // the ~370 cells. One delegated mouseover finds the cell by its data-index.
  const grid = useMemo(() => {
    const handleMouseOver = (e: React.MouseEvent<HTMLDivElement>) => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-index]")
      const wrapper = wrapperRef.current
      if (!cell || !wrapper) return
      const c = cell.getBoundingClientRect()
      const w = wrapper.getBoundingClientRect()
      const centerX = c.left - w.left + c.width / 2
      setHover({
        day: dayData[Number(cell.dataset.index)],
        // Grow away from the nearer edge, like the holdings heatmap, so the
        // first and last columns don't push the tooltip off the card.
        ...(centerX < w.width / 2 ? { left: centerX } : { right: w.width - centerX }),
        bottom: w.bottom - c.top + 6,
      })
    }

    return (
      <div className="overflow-x-auto" onScroll={() => setHover(null)}>
        {/* Month labels */}
        <div className="mb-1 ml-6 flex gap-[3px]">
          {Array.from({ length: weeks }).map((_, weekIdx) => {
            const monthLabel = monthLabels.find((m) => m.week === weekIdx)
            return (
              <div key={weekIdx} className="w-3 flex-shrink-0">
                {monthLabel && (
                  <span className="text-xs text-muted-foreground">{monthLabel.label}</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex gap-1">
          {/* Day of week labels */}
          <div className="flex w-5 flex-shrink-0 flex-col gap-[3px]">
            {DAY_LABELS.map((label, idx) => (
              <div
                key={idx}
                className="flex h-3 items-center justify-end text-xs text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            className="flex gap-[3px]"
            onMouseOver={handleMouseOver}
            onMouseLeave={() => setHover(null)}
          >
            {Array.from({ length: weeks }).map((_, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const index = weekIdx * 7 + dayIdx
                  return (
                    <div
                      key={dayIdx}
                      data-index={index}
                      className="h-3 w-3 cursor-pointer rounded-sm transition-transform hover:scale-110"
                      style={{ backgroundColor: getReturnColor(dayData[index].returnPct) }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-start gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-[3px]">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#EF4444" }} />
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "rgba(248, 113, 113, 0.5)" }} />
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#1A1D25" }} />
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "rgba(52, 211, 153, 0.5)" }} />
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "#10B981" }} />
          </div>
          <span>More</span>
        </div>
      </div>
    )
  }, [dayData, weeks, monthLabels])

  return (
    <Card className="rounded-xl">
      <CardHeader className="px-3 md:px-6">
        <CardTitle className="text-foreground">Daily Returns</CardTitle>
      </CardHeader>
      <CardContent className="px-3 md:px-6">
        {/* The tooltip sits outside the scroll container, which would clip it. */}
        <div ref={wrapperRef} className="relative">
          {grid}
          {hover && <DayTooltip hover={hover} />}
        </div>
      </CardContent>
    </Card>
  )
}

// pointer-events-none lets the mouse pass through to the cells underneath, so
// moving toward the tooltip hovers the next cell instead of being blocked.
// It isn't keyed by day: it fades in once, then just moves from cell to cell.
function DayTooltip({ hover }: { hover: HoverState }) {
  const { date, returnPct, dollarChange } = hover.day
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground shadow-lg duration-200 animate-in fade-in zoom-in-95"
      style={{ left: hover.left, right: hover.right, bottom: hover.bottom }}
    >
      <p className="font-medium">{date}</p>
      {returnPct !== null && dollarChange !== null ? (
        <>
          <p
            className={`font-mono ${
              returnPct >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
            }`}
          >
            {returnPct >= 0 ? "+" : ""}
            {returnPct.toFixed(2)}%
          </p>
          <p className="font-mono text-muted-foreground">
            {dollarChange >= 0 ? "+" : ""}
            ${formatCurrency(dollarChange)}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">No data</p>
      )}
    </div>
  )
}
