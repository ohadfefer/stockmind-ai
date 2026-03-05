"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

const watchlistData = [
  {
    ticker: "AAPL",
    exchange: "NASD",
    price: "$182.52",
    change: "+1.24%",
    positive: true,
    volume: "52.4M",
    aiScore: 88,
    sparkline: [40, 42, 38, 44, 46, 48, 45, 50, 52, 54, 53, 56],
  },
  {
    ticker: "TSLA",
    exchange: "NASD",
    price: "$168.10",
    change: "-2.15%",
    positive: false,
    volume: "94.1M",
    aiScore: 42,
    sparkline: [60, 58, 55, 50, 52, 48, 45, 42, 40, 38, 36, 35],
  },
  {
    ticker: "NVDA",
    exchange: "NASD",
    price: "$924.50",
    change: "+6.80%",
    positive: true,
    volume: "102M",
    aiScore: 96,
    sparkline: [30, 35, 40, 45, 50, 55, 58, 62, 68, 72, 78, 82],
  },
  {
    ticker: "MSFT",
    exchange: "NASD",
    price: "$415.10",
    change: "+0.45%",
    positive: true,
    volume: "22.8M",
    aiScore: 82,
    sparkline: [50, 52, 51, 53, 55, 54, 56, 58, 57, 59, 60, 62],
  },
]

function getScoreColor(score: number) {
  if (score >= 80) return "bg-[#10B981] text-[#FFFFFF]"
  if (score >= 60) return "bg-[#F59E0B] text-[#0A0B0D]"
  return "bg-[#EF4444] text-[#FFFFFF]"
}

function MiniSparkline({
  data,
  positive,
}: {
  data: number[]
  positive: boolean
}) {
  const chartData = data.map((v, i) => ({ i, v }))
  const color = positive ? "#10B981" : "#EF4444"

  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient
            id={`grad-${positive ? "up" : "down"}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#grad-${positive ? "up" : "down"})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function WatchlistQuickView() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">My Watchlist</h2>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View All
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ticker
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Price
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Change%
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Volume
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Score
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sparkline
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {watchlistData.map((stock) => (
            <TableRow
              key={stock.ticker}
              className="border-border hover:bg-secondary/50 transition-colors"
            >
              <TableCell className="pl-5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">
                    {stock.ticker}
                  </span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {stock.exchange}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm text-foreground">
                {stock.price}
              </TableCell>
              <TableCell
                className={`font-mono text-sm font-semibold ${
                  stock.positive ? "text-[#10B981]" : "text-[#EF4444]"
                }`}
              >
                {stock.change}
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {stock.volume}
              </TableCell>
              <TableCell className="text-center">
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-lg font-mono text-xs font-bold ${getScoreColor(
                    stock.aiScore
                  )}`}
                >
                  {stock.aiScore}
                </span>
              </TableCell>
              <TableCell>
                <MiniSparkline
                  data={stock.sparkline}
                  positive={stock.positive}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
