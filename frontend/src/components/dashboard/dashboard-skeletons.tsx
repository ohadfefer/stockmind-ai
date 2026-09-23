import { Fragment } from "react"

/**
 * Loading fallbacks for the dashboard, deliberately kept out of
 * dashboard-content.tsx and free of any "use client" directive.
 *
 * dashboard/loading.tsx is a server component. Importing these from the
 * client module would make them client references, so the browser would have
 * to download that route's chunk — Recharts included, via KPICards and
 * HoldingsHeatmap — before it could paint a fallback whose whole job is to
 * appear instantly. Here they render on the server with no client JS.
 *
 * No directive, so this file works on both sides: DashboardContent imports
 * the same components for its <Suspense> fallbacks.
 */

/**
 * The whole-page fallback for dashboard/loading.tsx. Mirrors
 * DashboardContent's layout and reuses its per-section fallbacks, so the swap
 * from this to the real page's Suspense fallbacks is pixel-identical. Keep
 * the two structures in sync.
 */
export function DashboardContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <MarketOverviewBarSkeleton />
      <KPICardsSkeleton />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HoldingsHeatmapSkeleton />
        <NewsFeedSkeleton />
      </div>
    </div>
  )
}

export function MarketOverviewBarSkeleton() {
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

export function KPICardsSkeleton() {
  return (
    <>
      {/* Mobile: single split card */}
      <div className="flex animate-pulse items-stretch rounded-xl border border-border bg-card md:hidden">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className={`flex flex-1 flex-col gap-2 p-3 ${
              i === 0 ? "border-r border-border" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-secondary" />
              <div className="h-3 w-8 rounded bg-secondary" />
            </div>
            <div className="h-5 w-16 rounded bg-secondary" />
            <div className="h-3 w-full rounded bg-secondary" />
          </div>
        ))}
      </div>

      {/* Desktop: three cards */}
      <div className="hidden animate-pulse gap-4 md:grid md:grid-cols-3">
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
    </>
  )
}

export function HoldingsHeatmapSkeleton() {
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

function NewsItemSkeleton() {
  // Mirrors NewsItemContent: 2-line headline, 2-line summary, source row.
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-4 w-full rounded bg-secondary" />
      <div className="h-4 w-3/4 rounded bg-secondary" />
      <div className="mt-0.5 h-3 w-full rounded bg-secondary" />
      <div className="h-3 w-5/6 rounded bg-secondary" />
      <div className="mt-0.5 h-3 w-24 rounded bg-secondary" />
    </div>
  )
}

export function NewsFeedSkeleton() {
  return (
    <div className="flex animate-pulse flex-col rounded-xl border border-border bg-card">
      <div className="px-5 py-4">
        <div className="h-6 w-40 rounded bg-secondary" />
      </div>

      {/* Mobile: horizontal swipe cards */}
      <div className="flex gap-4 overflow-hidden px-5 pb-4 md:hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-64 shrink-0">
            <NewsItemSkeleton />
          </div>
        ))}
      </div>

      {/* Desktop: vertical list with centered separators */}
      <div className="hidden flex-1 flex-col justify-between gap-5 px-5 pb-5 md:flex">
        {Array.from({ length: 3 }).map((_, i) => (
          <Fragment key={i}>
            {i > 0 && <div className="h-px shrink-0 bg-border" />}
            <NewsItemSkeleton />
          </Fragment>
        ))}
      </div>
    </div>
  )
}
