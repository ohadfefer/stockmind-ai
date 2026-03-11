"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Trash2, BellRing } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

export interface WatchlistStockData {
  ticker: string
  company: string
  price: number
  changeDollar: number
  changePercent: number
  marketCap: string | null
  dayLow: number | null
  dayHigh: number | null
  aiScore: number | null
  sparkline: number[]
}

function getAIScoreColor(score: number): string {
  if (score >= 8) return "bg-[#10B981] text-[#FFFFFF]"
  if (score >= 6) return "bg-[#F59E0B] text-[#0A0B0D]"
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
  const gradientId = `sparkline-${positive ? "up" : "down"}`

  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function RangeBar({
  low,
  high,
  current,
}: {
  low: number
  high: number
  current: number
}) {
  const range = high - low
  const position = range > 0 ? ((current - low) / range) * 100 : 50
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] text-muted-foreground">
        {low.toFixed(0)}
      </span>
      <div className="relative h-1.5 w-20 rounded-full bg-secondary">
        <div
          className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `calc(${Math.min(Math.max(position, 0), 100)}% - 5px)` }}
        />
      </div>
      <span className="font-mono text-[11px] text-muted-foreground">
        {high.toFixed(0)}
      </span>
    </div>
  )
}

interface WatchlistTabProps {
  stocks: WatchlistStockData[]
}

export function WatchlistTab({ stocks }: WatchlistTabProps) {
  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <p className="text-lg font-semibold text-foreground">
          No stocks in your watchlist
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow stocks from their detail page to add them here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
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
              Change $
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Change %
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Market Cap
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Day Range
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Score
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              7-Day
            </TableHead>
            <TableHead className="text-right pr-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stocks.map((stock) => {
            const positive = stock.changePercent >= 0
            return (
              <TableRow
                key={stock.ticker}
                className="border-border transition-colors hover:bg-secondary/40"
              >
                <TableCell className="pl-5">
                  <div>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {stock.ticker}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {stock.company}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  ${stock.price.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`font-mono text-sm font-semibold ${
                    positive ? "text-[#10B981]" : "text-[#EF4444]"
                  }`}
                >
                  {positive ? "+" : ""}${stock.changeDollar.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`font-mono text-sm font-semibold ${
                    positive ? "text-[#10B981]" : "text-[#EF4444]"
                  }`}
                >
                  {positive ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {stock.marketCap ?? "—"}
                </TableCell>
                <TableCell>
                  {stock.dayLow != null && stock.dayHigh != null ? (
                    <RangeBar
                      low={stock.dayLow}
                      high={stock.dayHigh}
                      current={stock.price}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {stock.aiScore != null ? (
                    <span
                      className={`inline-flex size-8 items-center justify-center rounded-lg font-mono text-xs font-bold ${getAIScoreColor(
                        stock.aiScore
                      )}`}
                    >
                      {stock.aiScore}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {stock.sparkline.length > 0 ? (
                    <MiniSparkline data={stock.sparkline} positive={positive} />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right pr-5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Actions</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-card border-border"
                    >
                      <DropdownMenuItem className="gap-2 text-foreground">
                        <Eye className="size-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-foreground">
                        <BellRing className="size-4" />
                        Set Alert
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-[#EF4444]"
                        variant="destructive"
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
