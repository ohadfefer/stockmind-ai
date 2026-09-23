import { TabBarShell } from "@/components/tab-bar-shell"

/**
 * Loading fallbacks for the portfolio. See dashboard-skeletons.tsx for why
 * these live outside the "use client" modules they belong to: portfolio/
 * loading.tsx is a server component, and importing PortfolioTabSkeleton from
 * portfolio-tab would make the fallback wait on that route's chunk, Recharts
 * included (via PortfolioTopPositions).
 *
 * No directive, so PortfolioTabContent imports the same component for its
 * <Suspense> fallback.
 */

/**
 * Stand-in for PortfolioTabsBar while the page loads.
 *
 * The real bar can't be used here: it reads ?tab= through useSearchParams,
 * and loading.tsx is prerendered, where a client hook reading URL data must
 * sit behind its own Suspense boundary or the production build fails
 * (dev renders on demand and hides this). A static strip is what such a
 * boundary would show anyway, and it also stops a tab from being clicked
 * mid-navigation.
 */
export function PortfolioTabBarSkeleton() {
  return (
    <TabBarShell className="animate-pulse" scrollClassName="py-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-5 w-24 shrink-0 rounded bg-secondary" />
      ))}
    </TabBarShell>
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
