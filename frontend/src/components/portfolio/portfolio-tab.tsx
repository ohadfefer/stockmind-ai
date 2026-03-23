"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import {
  Sparkles,
  TrendingUp,
  DollarSign,
  Wallet,
  ArrowUpRight,
} from "lucide-react"
import {
  holdings,
  sectorAllocation,
} from "@/lib/mock-data"
import { fetchPortfolioSummary } from "@/actions/portfolio"
import type { PortfolioSummary } from "@/services/portfolio-service"

interface PortfolioTabProps {
  summary: PortfolioSummary
}

export function PortfolioTab({ summary: initialSummary }: PortfolioTabProps) {
  const [summary, setSummary] = useState(initialSummary)

  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await fetchPortfolioSummary()
      if (updated) setSummary(updated)
    }, 60_000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="flex flex-col gap-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Cash Balance"
          icon={<Wallet className="size-4 text-primary" />}
          value={`$${summary.runningBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sub={
            <span className="text-sm text-muted-foreground">Available Cash</span>
          }
        />
        <SummaryCard
          label="Total Value"
          icon={<DollarSign className="size-4 text-muted-foreground" />}
          value={`$${summary.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          sub={
            <span className="text-sm text-muted-foreground">Market Value</span>
          }
        />
        <SummaryCard
          label="Total P&L"
          icon={<TrendingUp className={`size-4 ${summary.totalPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`} />}
          value={`${summary.totalPL >= 0 ? "+" : ""}$${summary.totalPL.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          valueColor={summary.totalPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}
          sub={
            <span className={`text-sm ${summary.totalPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {summary.totalPL >= 0 ? "+" : ""}{summary.totalPLPercent.toFixed(1)}% Lifetime
            </span>
          }
        />
        <SummaryCard
          label="Today's P&L"
          icon={<ArrowUpRight className={`size-4 ${summary.todayPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`} />}
          value={`${summary.todayPL >= 0 ? "+" : ""}$${summary.todayPL.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          valueColor={summary.todayPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}
          sub={
            <span className={`text-sm ${summary.todayPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {summary.todayPL >= 0 ? "+" : ""}{summary.todayPLPercent.toFixed(1)}%
            </span>
          }
        />
      </div>

      {/* Sector Allocation + AI Strategy Insight */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Donut + Legend */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="relative mx-auto size-52 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorAllocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {sectorAllocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-bold text-foreground">
                52%
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tech
              </span>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Sector Allocation
              </h3>
              <p className="text-sm text-muted-foreground">
                Diversification Score:{" "}
                <span className="font-semibold text-[#10B981]">Good</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sectorAllocation.map((sector) => (
                <div key={sector.name} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: sector.color }}
                  />
                  <span className="text-sm text-foreground">{sector.name}</span>
                  <span className="ml-auto font-mono text-sm font-semibold text-foreground">
                    {sector.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Strategy Insight */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-base font-semibold text-primary">
              AI Strategy Insight
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your portfolio is heavily weighted in Tech. AI suggests balancing
            with defensive stocks in Energy or Utilities to reduce volatility
            (Beta: 1.42).
          </p>
          <button className="mt-auto rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-border">
            Review Rebalance Plan
          </button>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-semibold text-foreground">
            Current Holdings
          </h3>
          <Tabs defaultValue="equity">
            <TabsList className="h-8 bg-secondary">
              <TabsTrigger value="equity" className="h-7 text-xs px-3">
                Equity
              </TabsTrigger>
              <TabsTrigger value="options" className="h-7 text-xs px-3">
                Options
              </TabsTrigger>
              <TabsTrigger value="crypto" className="h-7 text-xs px-3">
                Crypto
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ticker
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Shares
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Avg Buy
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Price
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Value
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {"P&L $ (%)"}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Day Change
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Portfolio Weight
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h) => {
                const plPositive = h.plDollar >= 0
                const dayPositive = h.dayChangeDollar >= 0
                return (
                  <TableRow
                    key={h.ticker}
                    className="border-border transition-colors hover:bg-secondary/40"
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-primary">
                          {h.ticker}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {h.company}
                          </p>
                          <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {h.sector}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      {h.shares.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      ${h.avgBuy.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      ${h.currentPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      ${h.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`font-mono text-sm font-semibold ${
                          plPositive ? "text-[#10B981]" : "text-[#EF4444]"
                        }`}
                      >
                        {plPositive ? "+" : ""}${h.plDollar.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        <br />
                        <span className="text-xs">
                          {plPositive ? "+" : ""}{h.plPercent.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`font-mono text-sm font-semibold ${
                          dayPositive ? "text-[#10B981]" : "text-[#EF4444]"
                        }`}
                      >
                        {dayPositive ? "+" : ""}${h.dayChangeDollar.toFixed(2)}
                        <br />
                        <span className="text-xs">
                          ({dayPositive ? "+" : ""}{h.dayChangePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${h.portfolioWeight}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">
                          {h.portfolioWeight.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  icon,
  value,
  valueColor,
  sub,
}: {
  label: string
  icon: React.ReactNode
  value: string
  valueColor?: string
  sub: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <p
        className={`font-mono text-2xl font-bold tracking-tight ${
          valueColor ?? "text-foreground"
        }`}
      >
        {value}
      </p>
      {sub}
    </div>
  )
}
