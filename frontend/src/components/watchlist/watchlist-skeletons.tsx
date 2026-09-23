/**
 * Loading fallbacks for the watchlist. See dashboard-skeletons.tsx for why
 * these live outside the "use client" modules they belong to: watchlist/
 * loading.tsx is a server component, and importing them from watchlist-tab
 * or watchlist-content would make the fallback wait on that route's chunk.
 *
 * No directive, so WatchlistContent imports the same components for its
 * <Suspense> fallbacks.
 */

/**
 * The whole-page fallback for watchlist/loading.tsx. Mirrors
 * WatchlistContent's layout and reuses its per-section fallbacks, so the swap
 * from this to the real page's Suspense fallbacks is pixel-identical. Keep
 * the two structures in sync.
 */
export function WatchlistContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <WatchlistListBarSkeleton />
      <WatchlistTabSkeleton />
    </div>
  )
}

export function WatchlistListBarSkeleton() {
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

export function WatchlistTabSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card">
      <div className="flex items-center gap-6 border-b border-border px-5 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 w-20 rounded bg-secondary" />
        ))}
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-secondary" />
        ))}
      </div>
    </div>
  )
}
