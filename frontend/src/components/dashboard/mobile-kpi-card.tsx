"use client"

import { useState } from "react"
import type { EtfQuote } from "@/services/dashboard/etf-quote-service"
import type { Holding } from "@/services/portfolio/portfolio-service"
import type { PortfolioStats } from "@/services/position/portfolio-daily-value-service"
import { TopMoversCard } from "@/components/dashboard/top-movers-card"

interface MobileKpiCardProps {
  portfolioReturnPercent: number
  etfs: EtfQuote[]
  holdings: Holding[]
  stats: PortfolioStats | null
  className?: string
}

type RightView = "market" | "winrate"

/**
 * Mobile-only KPI card: the three desktop KPI cards collapse into one card split
 * into two sections. The left section is fixed (Top Movers); the right section
 * is tappable to switch between Portfolio-vs-Market and Daily Win Rate.
 */
export function MobileKpiCard({
  portfolioReturnPercent,
  etfs,
  holdings,
  stats,
  className,
}: MobileKpiCardProps) {
  const [view, setView] = useState<RightView>("market")

  return (
    <div
      className={`flex items-stretch overflow-hidden rounded-xl border border-border bg-card ${
        className ?? ""
      }`}
    >
      {/* Left: Top Movers — fixed */}
      <div className="min-w-0 flex-1 border-r border-border p-3">
        <TopMoversCard
          holdings={holdings}
          compact
          className="flex h-full flex-col gap-2"
        />
      </div>

      {/* Right: switchable — tap to toggle metric */}
      <button
        type="button"
        onClick={() => setView((v) => (v === "market" ? "winrate" : "market"))}
        aria-label={
          view === "market"
            ? "Showing Portfolio vs. Market. Tap to show Daily Win Rate."
            : "Showing Daily Win Rate. Tap to show Portfolio vs. Market."
        }
        className="flex min-w-0 flex-1 flex-col p-3 text-left transition-colors active:bg-muted/40"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {view === "market" ? "Port. vs. Mrkt" : "Daily Win Rate"}
          </span>
          <Dots view={view} />
        </div>

        <div className="mt-1 flex flex-1 flex-col gap-1">
          {view === "market" ? (
            <MarketBody
              portfolioReturnPercent={portfolioReturnPercent}
              etfs={etfs}
            />
          ) : (
            <WinRateBody stats={stats} />
          )}
        </div>
      </button>
    </div>
  )
}

function Dots({ view }: { view: RightView }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <span
        className={`size-1.5 rounded-full transition-colors ${
          view === "market" ? "bg-foreground" : "bg-muted-foreground/40"
        }`}
      />
      <span
        className={`size-1.5 rounded-full transition-colors ${
          view === "winrate" ? "bg-foreground" : "bg-muted-foreground/40"
        }`}
      />
    </span>
  )
}

function MarketBody({
  portfolioReturnPercent,
  etfs,
}: {
  portfolioReturnPercent: number
  etfs: EtfQuote[]
}) {
  const portfolioSign = portfolioReturnPercent > 0 ? "+" : ""
  // Mobile keeps only the SPY benchmark; falls back to the first ETF if absent.
  const spy = etfs.find((e) => e.ticker === "SPY") ?? etfs[0]

  return (
    <>
      <p className="font-mono text-lg font-bold tracking-tight text-foreground">
        {portfolioSign}
        {portfolioReturnPercent.toFixed(2)}%
      </p>
      {spy ? (
        <div className="mt-auto flex items-center gap-1 text-[11px]">
          <span className="text-muted-foreground">{spy.ticker}</span>
          <span
            className={`font-mono font-semibold ${
              spy.changePercent >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
            }`}
          >
            {spy.changePercent > 0 ? "+" : ""}
            {spy.changePercent.toFixed(2)}%
          </span>
        </div>
      ) : (
        <div className="mt-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <span>vs. SPY</span>
          <span>—</span>
        </div>
      )}
    </>
  )
}

function WinRateBody({ stats }: { stats: PortfolioStats | null }) {
  if (!stats || stats.totalDays === 0) {
    return (
      <>
        <p className="font-mono text-lg font-bold tracking-tight text-muted-foreground">
          —
        </p>
        <span className="mt-auto text-[11px] text-muted-foreground">
          No history yet
        </span>
      </>
    )
  }

  const positive = stats.avgDailyReturnPct >= 0
  return (
    <>
      <p className="font-mono text-lg font-bold tracking-tight">
        <span className="text-foreground">{stats.gainDays}</span>
        <span className="text-muted-foreground">/{stats.totalDays}</span>
        <span className="ml-1 text-[11px] font-medium text-muted-foreground">
          days
        </span>
      </p>
      <div className="mt-auto flex items-center gap-1 text-[11px]">
        <span className="text-muted-foreground">Avg</span>
        <span
          className={`font-mono font-semibold ${
            positive ? "text-[#10B981]" : "text-[#EF4444]"
          }`}
        >
          {stats.avgDailyReturnPct > 0 ? "+" : ""}
          {stats.avgDailyReturnPct.toFixed(2)}%
        </span>
      </div>
    </>
  )
}
