"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { Wallet, Plus, ClipboardList, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchPortfolioSummary } from "@/actions/portfolio"
import { MobileTradeDialog } from "@/components/mobile/mobile-trade-dialog"
import { PortfolioHoldings } from "./portfolio-holdings"
import { PortfolioTopPositions } from "./portfolio-top-positions"
import type { PortfolioSummary } from "@/services/portfolio/portfolio-service"
import type { PortfolioReview } from "@/services/ai/portfolio-review-service"

type HoldingsView = "holdings" | "top-positions"

interface PortfolioTabProps {
  summaryPromise: Promise<PortfolioSummary>
  reviewPromise: Promise<PortfolioReview>
}

export function PortfolioTab({ summaryPromise, reviewPromise }: PortfolioTabProps) {
  const initialSummary = use(summaryPromise)
  const [summary, setSummary] = useState(initialSummary)
  const [view, setView] = useState<HoldingsView>("holdings")
  // Computed on mount to keep "as of" anchored to the client's ET wall clock
  // (avoids hydration mismatch from server vs. client `new Date()`).
  const [lastCloseLabel, setLastCloseLabel] = useState("")
  useEffect(() => {
    setLastCloseLabel(formatLastCloseDate())
  }, [])

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
      summary.marketOpen !== false ? setInterval(refresh, 60_000) : undefined

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      if (interval) clearInterval(interval)
    }
  }, [summary.marketOpen])

  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards — Portfolio Value spans wider since Cash Balance moved
          to the readout bar below. On mobile (2-col) it takes the full row
          with Total/Today's P&L sharing the row beneath. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          className="col-span-2"
          label="Portfolio Value"
          value={`$${summary.portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={<span className="text-sm text-muted-foreground">Market Value</span>}
        />
        <SummaryCard
          label="Total P&L"
          value={`${summary.totalPL >= 0 ? "+" : ""}$${summary.totalPL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          valueColor={summary.totalPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}
          sub={
            <span
              className={`text-sm ${summary.totalPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
            >
              {summary.totalPL >= 0 ? "+" : ""}
              {summary.totalPLPercent.toFixed(1)}% Lifetime
            </span>
          }
        />
        <SummaryCard
          label="Today's P&L"
          value={`${summary.todayPL >= 0 ? "+" : ""}$${summary.todayPL.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          valueColor={summary.todayPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}
          sub={
            <span
              className={`text-sm ${summary.todayPL >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}
            >
              {summary.todayPL >= 0 ? "+" : ""}
              {summary.todayPLPercent.toFixed(1)}%
            </span>
          }
        />
      </div>

      {/* Cash balance + holdings count readout. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Wallet className="size-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Cash Balance
          </span>
          <span className="font-mono font-semibold text-foreground">
            ${summary.runningBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </span>
        <span className="hidden text-muted-foreground/40 md:inline">•</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="size-4" />
          <span>
            {summary.holdings.length} {summary.holdings.length === 1 ? "holding" : "holdings"}
          </span>
        </span>
        {summary.marketOpen === false && lastCloseLabel && (
          <>
            <span className="hidden text-muted-foreground/40 md:inline">•</span>
            <span className="text-xs text-muted-foreground">
              Prices as of {lastCloseLabel} @ 4:00 PM ET
            </span>
          </>
        )}
      </div>

      {/* Trade/Orders actions — relocated from the parent tab bar. */}
      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href="/portfolio/orders"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          <ClipboardList className="size-4" />
          Orders
        </Link>
        {/* Mobile opens the inline bottom-sheet dialog; desktop still
            navigates to the full /portfolio/trade page. `display: contents`
            keeps layout flat while letting md:hidden unmount the whole
            dialog subtree on desktop. */}
        <div className="contents md:hidden">
          <MobileTradeDialog
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="size-4" />
                Trade
              </button>
            }
          />
        </div>
        <Link
          href="/portfolio/trade"
          className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 md:flex"
        >
          <Plus className="size-4" />
          Trade
        </Link>
      </div>

      {/* Holdings / Top Positions sub-nav. */}
      <div className="flex items-center gap-1 border-b border-border">
        <SubTab active={view === "holdings"} onClick={() => setView("holdings")}>
          Holdings
        </SubTab>
        <SubTab
          active={view === "top-positions"}
          onClick={() => setView("top-positions")}
        >
          Top Positions
        </SubTab>
      </div>

      {view === "holdings" ? (
        <PortfolioHoldings holdings={summary.holdings} />
      ) : (
        <PortfolioTopPositions
          holdings={summary.holdings}
          reviewPromise={reviewPromise}
        />
      )}
    </div>
  )
}

// Most recent US-market close in ET. Before 4pm ET we show the prior session;
// weekends roll back to Friday. Holiday closes aren't handled.
function formatLastCloseDate(): string {
  const now = new Date()
  const etParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) =>
    parseInt(etParts.find((p) => p.type === type)?.value ?? "0")
  const target = new Date(Date.UTC(get("year"), get("month") - 1, get("day")))
  if (get("hour") < 16) target.setUTCDate(target.getUTCDate() - 1)
  while (target.getUTCDay() === 0 || target.getUTCDay() === 6) {
    target.setUTCDate(target.getUTCDate() - 1)
  }
  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

function SubTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function SummaryCard({
  label,
  value,
  valueColor,
  sub,
  className,
}: {
  label: string
  value: string
  valueColor?: string
  sub: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card p-5",
        className,
      )}
    >
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <p
        className={`font-mono text-lg font-bold tracking-tight ${
          valueColor ?? "text-foreground"
        }`}
      >
        {value}
      </p>
      {sub}
    </div>
  )
}

export function PortfolioTabSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <div className="h-4 w-24 rounded bg-secondary" />
          <div className="h-5 w-40 rounded bg-secondary" />
          <div className="h-3 w-20 rounded bg-secondary" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
          >
            <div className="h-4 w-24 rounded bg-secondary" />
            <div className="h-5 w-32 rounded bg-secondary" />
            <div className="h-3 w-20 rounded bg-secondary" />
          </div>
        ))}
      </div>

      {/* Cash readout + actions */}
      <div className="h-4 w-48 rounded bg-secondary" />
      <div className="flex justify-end gap-3">
        <div className="h-9 w-24 rounded-lg bg-secondary" />
        <div className="h-9 w-24 rounded-lg bg-secondary" />
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-4 border-b border-border pb-3">
        <div className="h-4 w-20 rounded bg-secondary" />
        <div className="h-4 w-24 rounded bg-secondary" />
      </div>

      {/* Holdings placeholder */}
      <div className="rounded-xl border border-border bg-card">
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-secondary" />
          ))}
        </div>
      </div>
    </div>
  )
}
