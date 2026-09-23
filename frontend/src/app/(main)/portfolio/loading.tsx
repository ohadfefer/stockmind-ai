import {
  PortfolioTabBarSkeleton,
  PortfolioTabSkeleton,
} from "@/components/portfolio/portfolio-skeletons"

// See dashboard/loading.tsx for why this exists. Mirrors page.tsx: a tab bar
// over the default tab's fallback. Tab switches never reach here — they're
// history.pushState, not navigations — so the fallback only has to match the
// tab a sidebar click lands on.
//
// This boundary also wraps orders/ and trade/, which is why each has its own
// loading file: without one, navigating there would flash the holdings
// skeleton first.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <PortfolioTabBarSkeleton />
      <PortfolioTabSkeleton />
    </div>
  )
}
