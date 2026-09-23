import { DashboardContentSkeleton } from "@/components/dashboard/dashboard-skeletons"

// A dynamic route with no loading file isn't prefetched at all, so a sidebar
// click showed nothing until the server's first chunk crossed the wire. With
// this file Next prefetches the fallback and swaps it in on click; the page's
// own Suspense fallbacks then take over, and they're the same components.
export default function Loading() {
  return <DashboardContentSkeleton />
}
