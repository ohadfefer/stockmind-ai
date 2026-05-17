"use client"

import { Suspense, use } from "react"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { HoldingsHeatmap } from "@/components/dashboard/holdings-heatmap"
import { NewsFeed } from "@/components/dashboard/news-feed"
import { MarketOverviewBar } from "@/components/dashboard/market-overview-bar"
import type {
  DashboardPageData,
  DashboardKpiData,
  DashboardHeatmapData,
  DashboardNewsData,
} from "@/services/dashboard/dashboard-page-data"
import type { IndexQuote } from "@/services/dashboard/index-service"

export function DashboardContent({
  indexesPromise,
  kpiPromise,
  heatmapPromise,
  newsPromise,
}: DashboardPageData) {
  return (
    <div className="flex flex-col gap-6">
      <ErrorBoundary
        resetKeys={[indexesPromise]}
        fallback={
          <SectionError
            compact
            title="Couldn't load market overview"
            description="We couldn't fetch index quotes right now."
          />
        }
      >
        <Suspense fallback={<MarketOverviewBarSkeleton />}>
          <MarketOverviewSection indexesPromise={indexesPromise} />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary
        resetKeys={[kpiPromise]}
        fallback={
          <SectionError
            title="Couldn't load portfolio KPIs"
            description="We couldn't fetch your performance summary right now."
          />
        }
      >
        <Suspense fallback={<KPICardsSkeleton />}>
          <KpiSection kpiPromise={kpiPromise} />
        </Suspense>
      </ErrorBoundary>

      {/* Heatmap + news share one Suspense boundary so they reveal together.
          News is data-cached and resolves almost instantly; streaming it
          independently left the heatmap skeleton looking like a stuck
          placeholder next to already-loaded news. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense
          fallback={
            <>
              <HoldingsHeatmapSkeleton />
              <NewsFeedSkeleton />
            </>
          }
        >
          <ErrorBoundary
            resetKeys={[heatmapPromise]}
            fallback={
              <SectionError
                title="Couldn't load heatmap"
                description="We couldn't fetch your holdings right now."
              />
            }
          >
            <HeatmapSection heatmapPromise={heatmapPromise} />
          </ErrorBoundary>

          <ErrorBoundary
            resetKeys={[newsPromise]}
            fallback={
              <SectionError
                title="Couldn't load news"
                description="We couldn't fetch market news right now."
              />
            }
          >
            <NewsSection newsPromise={newsPromise} />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  )
}

function MarketOverviewSection({
  indexesPromise,
}: {
  indexesPromise: Promise<IndexQuote[]>
}) {
  const indexes = use(indexesPromise)
  return <MarketOverviewBar data={indexes} />
}

function KpiSection({
  kpiPromise,
}: {
  kpiPromise: Promise<DashboardKpiData>
}) {
  const { portfolioReturnPercent, etfs, holdings, stats } = use(kpiPromise)
  return (
    <KPICards
      portfolioReturnPercent={portfolioReturnPercent}
      etfs={etfs}
      holdings={holdings}
      stats={stats}
    />
  )
}

function HeatmapSection({
  heatmapPromise,
}: {
  heatmapPromise: Promise<DashboardHeatmapData>
}) {
  const { holdings, watchlist } = use(heatmapPromise)
  return <HoldingsHeatmap holdings={holdings} watchlist={watchlist} />
}

function NewsSection({
  newsPromise,
}: {
  newsPromise: Promise<DashboardNewsData>
}) {
  const { news, sentiment } = use(newsPromise)
  return <NewsFeed news={news} sentiment={sentiment} />
}

function MarketOverviewBarSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-9 w-40 shrink-0 rounded-full border border-border bg-card"
        />
      ))}
    </div>
  )
}

function KPICardsSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-secondary" />
            <div className="size-5 rounded bg-secondary" />
          </div>
          <div className="h-7 w-28 rounded bg-secondary" />
          <div className="h-3 w-40 rounded bg-secondary" />
        </div>
      ))}
    </div>
  )
}

function HoldingsHeatmapSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-4 w-20 rounded bg-secondary" />
          <div className="h-4 w-20 rounded bg-secondary" />
        </div>
        <div className="flex items-center gap-1">
          <div className="size-7 rounded-full bg-secondary" />
          <div className="size-7 rounded-full bg-secondary" />
        </div>
      </div>
      <div className="rounded bg-secondary" style={{ height: 300 }} />
      <div className="h-3 w-72 rounded bg-secondary" />
    </div>
  )
}

function NewsFeedSkeleton() {
  return (
    <div className="flex animate-pulse flex-col rounded-xl border border-border bg-card">
      <div className="px-5 py-4">
        <div className="h-6 w-40 rounded bg-secondary" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 border-t border-border px-5 py-4"
        >
          <div className="h-3 w-32 rounded bg-secondary" />
          <div className="h-4 w-11/12 rounded bg-secondary" />
          <div className="h-3 w-full rounded bg-secondary" />
        </div>
      ))}
    </div>
  )
}
