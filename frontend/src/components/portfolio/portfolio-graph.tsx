"use client"

import { useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

import type { PortfolioDailyValue } from "@/services/position/portfolio-daily-value-service"

interface PortfolioGraphProps {
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

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="text-sm text-muted-foreground">{label ? addOneDay(label) : ""}</p>
        <p className="font-mono text-sm font-semibold text-foreground">
          ${formatCurrency(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export function PortfolioGraph({ dailyValues }: PortfolioGraphProps) {
  const { chartData, totalReturn, totalReturnPct, latestValue } = useMemo(() => {
    const chartData = dailyValues.map((d) => ({ date: d.date, value: d.marketValue }))
    const latest = dailyValues[dailyValues.length - 1]
    const unrealized = latest ? latest.marketValue - latest.costBasis : 0
    const pct = latest && latest.costBasis > 0 ? (unrealized / latest.costBasis) * 100 : 0
    return {
      chartData,
      totalReturn: unrealized,
      totalReturnPct: pct,
      latestValue: latest?.marketValue ?? 0,
    }
  }, [dailyValues])

  const hasReturn = dailyValues.length > 0
  const returnIsPositive = totalReturn >= 0

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Portfolio Value</CardTitle>
        <div className="flex flex-wrap items-baseline gap-3">
          <p className="font-mono text-3xl font-bold text-foreground">
            ${formatCurrency(latestValue)}
          </p>
          {hasReturn && (
            <p
              className={`font-mono text-sm font-medium ${
                returnIsPositive ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {returnIsPositive ? "+" : "-"}${formatCurrency(Math.abs(totalReturn))} (
              {returnIsPositive ? "+" : ""}
              {totalReturnPct.toFixed(2)}%)
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", { month: "short" })
                }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
