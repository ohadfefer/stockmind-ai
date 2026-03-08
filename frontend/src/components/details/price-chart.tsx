"use client"

import { useState } from "react"
import clsx from "clsx"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

const TIME_PERIODS = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"] as const
type TimePeriod = (typeof TIME_PERIODS)[number]

function generateChartData(period: TimePeriod) {
  const basePrice = 118.11
  const points: { time: string; price: number }[] = []

  const configs: Record<TimePeriod, { count: number; labelFn: (i: number) => string; volatility: number; trend: number }> = {
    "1D": {
      count: 78,
      labelFn: (i) => {
        const hour = 9 + Math.floor((i * 6.5) / 78)
        const min = Math.floor(((i * 6.5 * 60) / 78) % 60)
        const ampm = hour >= 12 ? "PM" : "AM"
        const h = hour > 12 ? hour - 12 : hour
        return `${h}:${min.toString().padStart(2, "0")} ${ampm}`
      },
      volatility: 0.8,
      trend: -0.04,
    },
    "5D": {
      count: 50,
      labelFn: (i) => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
        return days[Math.floor((i / 50) * 5)] ?? "Fri"
      },
      volatility: 1.2,
      trend: -0.05,
    },
    "1M": {
      count: 30,
      labelFn: (i) => `Mar ${i + 1}`,
      volatility: 2,
      trend: -0.08,
    },
    "6M": {
      count: 60,
      labelFn: (i) => {
        const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
        return months[Math.floor((i / 60) * 6)] ?? "Mar"
      },
      volatility: 5,
      trend: -0.02,
    },
    "YTD": {
      count: 45,
      labelFn: (i) => {
        const months = ["Jan", "Feb", "Mar"]
        return months[Math.floor((i / 45) * 3)] ?? "Mar"
      },
      volatility: 4,
      trend: -0.03,
    },
    "1Y": {
      count: 52,
      labelFn: (i) => {
        const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"]
        return months[Math.floor((i / 52) * 12)] ?? "Mar"
      },
      volatility: 8,
      trend: 0.01,
    },
    "5Y": {
      count: 60,
      labelFn: (i) => `${2021 + Math.floor((i / 60) * 5)}`,
      volatility: 15,
      trend: 0.02,
    },
    MAX: {
      count: 80,
      labelFn: (i) => `${2000 + Math.floor((i / 80) * 26)}`,
      volatility: 25,
      trend: 0.05,
    },
  }

  const { count, labelFn, volatility, trend } = configs[period]
  let price = basePrice

  for (let i = 0; i < count; i++) {
    price += trend + (Math.random() - 0.52) * volatility
    points.push({ time: labelFn(i), price: Math.round(price * 100) / 100 })
  }

  return points
}

interface PriceChartProps {
  previousClose: number
}

export function PriceChart({ previousClose }: PriceChartProps) {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>("1D")
  const [chartData] = useState(() =>
    Object.fromEntries(TIME_PERIODS.map((p) => [p, generateChartData(p)])) as Record<TimePeriod, { time: string; price: number }[]>
  )

  const data = chartData[activePeriod]
  const currentPrice = data[data.length - 1]?.price ?? 0
  const isDown = currentPrice < previousClose

  const prices = data.map((d) => d.price)
  const minPrice = Math.min(...prices, previousClose) - 0.5
  const maxPrice = Math.max(...prices, previousClose) + 0.5

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {TIME_PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={clsx(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              activePeriod === period
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {period}
          </button>
        ))}
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isDown ? "var(--destructive)" : "var(--accent)"}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={isDown ? "var(--destructive)" : "var(--accent)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(v: number) => v.toFixed(2)}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--muted-foreground)" }}
              formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
            />
            <ReferenceLine
              y={previousClose}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: `Prev close $${previousClose.toFixed(2)}`,
                position: "right",
                fill: "var(--muted-foreground)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isDown ? "var(--destructive)" : "var(--accent)"}
              strokeWidth={2}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: isDown ? "var(--destructive)" : "var(--accent)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
