"use client"

import { Suspense, use, useState, useEffect, useMemo } from "react"
import Link from "next/link"
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
import { ErrorBoundary, SectionError } from "@/components/section-error"
import { MobileDataCard } from "@/components/mobile-data-card"
import { cn } from "@/lib/utils"
import { fetchPortfolioSummary } from "@/actions/portfolio"
import type { PortfolioSummary } from "@/services/portfolio/portfolio-service"
import type { PortfolioReview } from "@/services/ai/portfolio-review-service"

const SECTOR_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"]
interface PortfolioTabProps {
  summaryPromise: Promise<PortfolioSummary>
  reviewPromise: Promise<PortfolioReview>
}

export function PortfolioTab({ summaryPromise, reviewPromise }: PortfolioTabProps) {
  const initialSummary = use(summaryPromise)
  const [summary, setSummary] = useState(initialSummary)

  // Poll once a minute while the market is open. While closed, prices are
  // frozen server-side so we don't poll — but a user returning after hours
  // should still see the latest close, so we refetch on tab refocus.
  useEffect(() => {
    async function refresh() {
      const updated = await fetchPortfolioSummary()
      if (updated) setSummary(updated)
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    const interval =
      summary.marketOpen !== false
        ? setInterval(refresh, 60_000)
        : undefined

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (interval) clearInterval(interval)
    }
  }, [summary.marketOpen])

  {/* PieChart */}
  const sectorAllocation = useMemo(() => {
    const sectorMap = new Map<string, number>()
    for (const h of summary.holdings) {
      sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.totalValue)
    }
    const total = [...sectorMap.values()].reduce((a, b) => a + b, 0)
    return [...sectorMap.entries()]
      .map(([name, value], i) => ({
        name,
        value: total > 0 ? Math.round((value / total) * 100) : 0,
        color: SECTOR_COLORS[i % SECTOR_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [summary.holdings])

  const topSector = sectorAllocation[0]
  
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
          label="Portfolio Value"
          icon={<DollarSign className="size-4 text-muted-foreground" />}
          value={`$${summary.portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
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
          {/* Pie + center label only on >=md; on small screens it shrinks
              past the point where labels stay readable, so we show just
              the legend list below. */}
          <div className="relative mx-auto hidden size-52 sm:mx-0 md:block">
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
                  isAnimationActive={false}
                >
                  {sectorAllocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            {topSector && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-bold text-foreground">
                  {topSector.value}%
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {topSector.name}
                </span>
              </div>
            )}
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

        {/* AI Strategy Insight — failures here stay contained to this card
            so the holdings table still renders. */}
        <ErrorBoundary
          resetKeys={[reviewPromise]}
          fallback={
            <SectionError
              compact
              title="AI insight unavailable"
              description="Couldn't load the strategy insight."
            />
          }
        >
          <Suspense fallback={<AiInsightCardSkeleton />}>
            <AiInsightCard reviewPromise={reviewPromise} />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Holdings — desktop table */}
      <div className="hidden rounded-xl border border-border bg-card md:block">
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
              {summary.holdings.map((h) => {
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

      {/* Holdings — mobile cards. Omits the Equity/Options/Crypto tab stub
          (no filtering wired up yet) to keep mobile focused on the data. */}
      <div className="flex flex-col gap-3 md:hidden">
        <h3 className="text-base font-semibold text-foreground">
          Current Holdings
        </h3>
        {summary.holdings.map((h) => {
          const plPositive = h.plDollar >= 0
          const dayPositive = h.dayChangeDollar >= 0
          const plColor = plPositive ? "text-[#10B981]" : "text-[#EF4444]"
          const dayColor = dayPositive ? "text-[#10B981]" : "text-[#EF4444]"
          return (
            <MobileDataCard key={h.ticker}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-primary">
                    {h.ticker}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">
                    {h.company}
                  </p>
                  <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {h.sector}
                  </span>
                </div>
                <p className="shrink-0 font-mono text-base font-bold text-foreground">
                  ${h.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    P&L
                  </p>
                  <p className={cn("font-mono text-sm font-semibold", plColor)}>
                    {plPositive ? "+" : ""}${h.plDollar.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                  <p className={cn("font-mono text-xs", plColor)}>
                    {plPositive ? "+" : ""}{h.plPercent.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Day
                  </p>
                  <p className={cn("font-mono text-sm font-semibold", dayColor)}>
                    {dayPositive ? "+" : ""}${h.dayChangeDollar.toFixed(2)}
                  </p>
                  <p className={cn("font-mono text-xs", dayColor)}>
                    ({dayPositive ? "+" : ""}{h.dayChangePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Shares
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {h.shares.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Avg Buy
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    ${h.avgBuy.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Current
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    ${h.currentPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 border-t border-border pt-3">
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Weight
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${h.portfolioWeight}%` }}
                  />
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {h.portfolioWeight.toFixed(1)}%
                </span>
              </div>
            </MobileDataCard>
          )
        })}
      </div>
    </div>
  )
}

function AiInsightCard({ reviewPromise }: { reviewPromise: Promise<PortfolioReview> }) {
  const review = use(reviewPromise)
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary" />
        <h3 className="text-base font-semibold text-primary">
          AI Strategy Insight
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {review.short || "No insight available. Add holdings to your portfolio."}
      </p>
      <Link
        href="/portfolio?tab=analyze"
        className="mt-auto rounded-lg border border-border bg-secondary px-4 py-2.5 text-center text-sm font-semibold text-foreground transition-colors hover:bg-border"
      >
        View Full Analysis
      </Link>
    </div>
  )
}

function AiInsightCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-primary/40" />
        <div className="h-4 w-40 rounded bg-secondary" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-secondary" />
        <div className="h-3 w-11/12 rounded bg-secondary" />
        <div className="h-3 w-9/12 rounded bg-secondary" />
      </div>
      <div className="mt-auto h-10 rounded-lg bg-secondary" />
    </div>
  )
}

export function PortfolioTabSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-secondary" />
              <div className="size-4 rounded bg-secondary" />
            </div>
            <div className="h-7 w-32 rounded bg-secondary" />
            <div className="h-3 w-20 rounded bg-secondary" />
          </div>
        ))}
      </div>

      {/* Sector allocation + AI insight */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="mx-auto size-52 rounded-full bg-secondary sm:mx-0" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="h-5 w-40 rounded bg-secondary" />
            <div className="h-3 w-48 rounded bg-secondary" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 w-full rounded bg-secondary" />
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
          <div className="h-5 w-40 rounded bg-secondary" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-secondary" />
            <div className="h-3 w-11/12 rounded bg-secondary" />
            <div className="h-3 w-9/12 rounded bg-secondary" />
          </div>
          <div className="mt-auto h-10 rounded-lg bg-secondary" />
        </div>
      </div>

      {/* Holdings table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="h-5 w-40 rounded bg-secondary" />
          <div className="h-8 w-48 rounded bg-secondary" />
        </div>
        <div className="space-y-3 px-5 pb-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-secondary" />
          ))}
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
