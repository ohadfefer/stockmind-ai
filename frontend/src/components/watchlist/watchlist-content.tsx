"use client"

import { Suspense, use } from "react"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import { WatchlistListBar } from "@/components/watchlist/watchlist-list-bar"
import { WatchlistTab, WatchlistTabSkeleton } from "@/components/watchlist/watchlist-tab"
import type {
  WatchlistPageData,
  WatchlistStocks,
} from "@/services/watchlist/watchlist-page-data"
import type { WatchlistInfo } from "@/types/watchlist"

export function WatchlistContent({
  watchlistsPromise,
  stocksPromise,
}: WatchlistPageData) {
  return (
    <div className="flex flex-col gap-6">
      <ErrorBoundary
        resetKeys={[watchlistsPromise]}
        fallback={
          <SectionError
            compact
            title="Couldn't load watchlists"
            description="We couldn't fetch your watchlists right now."
          />
        }
      >
        <Suspense fallback={<WatchlistListBarSkeleton />}>
          <ListBarSection watchlistsPromise={watchlistsPromise} />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary
        resetKeys={[stocksPromise]}
        fallback={
          <SectionError
            title="Couldn't load watchlist"
            description="We couldn't fetch the stocks in this watchlist right now."
          />
        }
      >
        <Suspense fallback={<WatchlistTabSkeleton />}>
          <TabSection stocksPromise={stocksPromise} />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

function ListBarSection({
  watchlistsPromise,
}: {
  watchlistsPromise: Promise<WatchlistInfo[]>
}) {
  const watchlists = use(watchlistsPromise)
  return <WatchlistListBar watchlists={watchlists} />
}

function TabSection({
  stocksPromise,
}: {
  stocksPromise: Promise<WatchlistStocks>
}) {
  const { stocks, activeWatchlistId } = use(stocksPromise)
  return <WatchlistTab stocks={stocks} watchlistId={activeWatchlistId} />
}

function WatchlistListBarSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-1 border-b">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-4 py-2.5">
          <div className="h-5 w-28 rounded bg-secondary" />
        </div>
      ))}
    </div>
  )
}
