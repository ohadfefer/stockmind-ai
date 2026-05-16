import Link from "next/link"
import { TrendingUp, TrendingDown, LineChart, ArrowRight } from "lucide-react"
import type { EtfQuote } from "@/services/dashboard/etf-quote-service"
import type { Holding } from "@/services/portfolio/portfolio-service"
import type { PortfolioStats } from "@/services/position/portfolio-daily-value-service"
import { TopMoversCard } from "@/components/dashboard/top-movers-card"

interface KPICardsProps {
  portfolioReturnPercent: number
  etfs: EtfQuote[]
  holdings: Holding[]
  stats: PortfolioStats | null
}

export function KPICards({
  portfolioReturnPercent,
  etfs,
  holdings,
  stats,
}: KPICardsProps) {
  const portfolioSign = portfolioReturnPercent > 0 ? "+" : ""

  const benchmark = etfs.find((e) => e.ticker === "SPY") ?? etfs[0]
  let comparisonLabel = "Tracking"
  if (benchmark) {
    const diff = portfolioReturnPercent - benchmark.changePercent
    if (diff >= 1) comparisonLabel = "Outperforming"
    else if (diff <= -1) comparisonLabel = "Underperforming"
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <TopMoversCard holdings={holdings} />

      {/* Portfolio vs. Market */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Portfolio vs. Market
          </span>
          <LineChart className="size-5 text-muted-foreground" />
        </div>
        <p className="text-lg font-bold tracking-tight">
          <span className="font-mono text-foreground">
            {portfolioSign}
            {portfolioReturnPercent.toFixed(2)}%
          </span>
          <span className="text-foreground"> - {comparisonLabel}</span>
        </p>
        {etfs.length === 0 ? (
          <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>vs. SPY</span>
            <span>—</span>
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {etfs.map((etf) => {
              const positive = etf.changePercent >= 0
              const color = positive ? "text-[#10B981]" : "text-[#EF4444]"
              const sign = etf.changePercent > 0 ? "+" : ""
              return (
                <div key={etf.ticker} className="flex items-center gap-1">
                  <span className="text-muted-foreground">{etf.ticker}</span>
                  {positive ? (
                    <TrendingUp className="size-3.5 text-[#10B981]" />
                  ) : (
                    <TrendingDown className="size-3.5 text-[#EF4444]" />
                  )}
                  <span className={`font-mono font-semibold ${color}`}>
                    {sign}
                    {etf.changePercent.toFixed(2)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Daily Win Rate */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Daily Win Rate
          </span>
          <Link
            href="/account?tab=performance"
            className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Statistics
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        {stats && stats.totalDays > 0 ? (
          <>
            <p className="font-mono text-2xl font-bold tracking-tight">
              <span className="text-foreground">{stats.gainDays}</span>
              <span className="text-muted-foreground">/{stats.totalDays}</span>
              <span className="ml-1.5 text-base font-medium text-muted-foreground">
                days
              </span>
            </p>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">Avg daily return</span>
              <span
                className={`font-mono font-semibold ${
                  stats.avgDailyReturnPct >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                }`}
              >
                {stats.avgDailyReturnPct > 0 ? "+" : ""}
                {stats.avgDailyReturnPct.toFixed(2)}%
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="font-mono text-2xl font-bold text-muted-foreground tracking-tight">
              —
            </p>
            <span className="text-sm text-muted-foreground">No history yet</span>
          </>
        )}
      </div>
    </div>
  )
}
