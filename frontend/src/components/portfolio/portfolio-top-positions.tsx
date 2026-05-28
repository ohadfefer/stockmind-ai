"use client"

import { Suspense, use, useMemo } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { PieChart, Pie, ResponsiveContainer } from "recharts"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import type { Holding } from "@/services/portfolio/portfolio-service"
import type { PortfolioReview } from "@/services/ai/portfolio-review-service"

const SECTOR_COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
]

interface PortfolioTopPositionsProps {
  holdings: Holding[]
  reviewPromise: Promise<PortfolioReview>
}

export function PortfolioTopPositions({
  holdings,
  reviewPromise,
}: PortfolioTopPositionsProps) {
  const ranked = useMemo(
    () => [...holdings].sort((a, b) => b.portfolioWeight - a.portfolioWeight),
    [holdings],
  )

  const sectorAllocation = useMemo(() => {
    const sectorMap = new Map<string, number>()
    for (const h of holdings) {
      sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.totalValue)
    }
    const total = [...sectorMap.values()].reduce((a, b) => a + b, 0)
    return [...sectorMap.entries()]
      .map(([name, value], i) => ({
        name,
        value: total > 0 ? Math.round((value / total) * 100) : 0,
        fill: SECTOR_COLORS[i % SECTOR_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
  }, [holdings])

  const topSector = sectorAllocation[0]
  const maxWeight = ranked[0]?.portfolioWeight ?? 0

  return (
    <div className="flex flex-col gap-6">
      {/* How They Stack Up — relocated portfolio weight column. */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 md:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How They Stack Up
        </h3>
        <div className="flex flex-col gap-2.5">
          {ranked.map((h, i) => (
            <div key={h.ticker} className="flex items-center gap-3">
              <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground">
                #{i + 1}
              </span>
              <span className="w-14 shrink-0 font-mono text-sm font-bold text-primary">
                {h.ticker}
              </span>
              <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-secondary/60">
                <div
                  className="h-full rounded-md bg-primary/80"
                  style={{
                    width: `${
                      maxWeight > 0 ? (h.portfolioWeight / maxWeight) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-sm font-semibold text-foreground">
                {h.portfolioWeight.toFixed(2)}%
              </span>
            </div>
          ))}
          {ranked.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No holdings yet — add positions to see your concentration.
            </p>
          )}
        </div>
      </div>

      {/* Sector allocation + AI insight, relocated from the portfolio tab. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-8">
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
                />
              </PieChart>
            </ResponsiveContainer>
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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
              {sectorAllocation.map((sector) => (
                <div key={sector.name} className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: sector.fill }}
                  />
                  <span className="truncate text-sm text-foreground">
                    {sector.name}
                  </span>
                  <span className="ml-auto shrink-0 font-mono text-sm font-semibold text-foreground">
                    {sector.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

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
    </div>
  )
}

function AiInsightCard({
  reviewPromise,
}: {
  reviewPromise: Promise<PortfolioReview>
}) {
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
