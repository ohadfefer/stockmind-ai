"use client"

import { useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

function addOneDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const next = new Date(y, m - 1, d + 1)
  const yy = next.getFullYear()
  const mm = String(next.getMonth() + 1).padStart(2, "0")
  const dd = String(next.getDate()).padStart(2, "0")
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
  hasData: boolean
  dayOfWeek: number
  weekIndex: number
  month: string
}

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

    // Start from the Monday on or before Jan 1
    const startDate = new Date(jan1)
    const dayOffset = (startDate.getDay() + 6) % 7 // Monday = 0
    startDate.setDate(startDate.getDate() - dayOffset)

    const allDays: DayData[] = []
    const monthLabelSet = new Map<number, string>()

    let currentDate = new Date(startDate)
    let weekIndex = 0

    // Go through Dec 31 and finish the final week
    while (currentDate <= dec31 || (currentDate.getDay() + 6) % 7 !== 0) {
      const dateStr = currentDate.toISOString().split("T")[0]
      const dayOfWeek = (currentDate.getDay() + 6) % 7 // Monday = 0, Sunday = 6
      const month = currentDate.toLocaleDateString("en-US", { month: "short" })

      // Track month labels — place at the second week of each month, skip months outside the year
      if (currentDate.getDate() === 1 && currentDate.getFullYear() === year) {
        monthLabelSet.set(weekIndex + 1, month)
      }

      const returnData = dailyReturns.get(dateStr)
      const hasData = dailyReturns.has(dateStr)

      allDays.push({
        date: dateStr,
        returnPct: returnData?.returnPct ?? null,
        dollarChange: returnData?.dollarChange ?? null,
        hasData,
        dayOfWeek,
        weekIndex,
        month,
      })

      currentDate.setDate(currentDate.getDate() + 1)

      // Increment week after Sunday
      if (dayOfWeek === 6) {
        weekIndex++
      }

      // Safety break
      if (weekIndex > 60) break
    }

    return {
      dayData: allDays,
      weeks: weekIndex + 1,
      monthLabels: Array.from(monthLabelSet.entries()).map(([week, label]) => ({ week, label })),
    }
  }, [dailyValues])

  const dayLabels = ["M", "", "W", "", "F", "", ""]

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Daily Returns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
        <div className="overflow-x-auto">
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
              {dayLabels.map((label, idx) => (
                <div
                  key={idx}
                  className="flex h-3 items-center justify-end text-xs text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-[3px]">
              {Array.from({ length: weeks }).map((_, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const day = dayData.find(
                      (d) => d.weekIndex === weekIdx && d.dayOfWeek === dayIdx
                    )

                    if (!day) {
                      return (
                        <div
                          key={dayIdx}
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: "#1A1D25" }}
                        />
                      )
                    }

                    const bgColor = getReturnColor(day.returnPct)

                    return (
                      <Tooltip key={dayIdx}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-3 w-3 cursor-pointer rounded-sm transition-transform hover:scale-110"
                            style={{ backgroundColor: bgColor }}
                          />
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={6}
                          className="rounded-lg bg-card text-card-foreground border-border"
                        >
                          <div className="text-xs">
                            <p className="font-medium">{addOneDay(day.date)}</p>
                            {day.hasData ? (
                              <>
                                <p
                                  className={`font-mono ${
                                    day.returnPct! >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                                  }`}
                                >
                                  {day.returnPct! >= 0 ? "+" : ""}
                                  {day.returnPct!.toFixed(2)}%
                                </p>
                                <p className="font-mono text-muted-foreground">
                                  {day.dollarChange! >= 0 ? "+" : ""}
                                  ${formatCurrency(day.dollarChange!)}
                                </p>
                              </>
                            ) : (
                              <p className="text-muted-foreground">No data</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
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

        <div className="w-px self-stretch bg-border" />

        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Statistics and AI analysis coming soon</p>
        </div>
        </div>
      </CardContent>
    </Card>
  )
}
