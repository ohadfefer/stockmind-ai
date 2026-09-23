import { WatchlistContentSkeleton } from "@/components/watchlist/watchlist-skeletons"

// See dashboard/loading.tsx for why this exists. Note it also shows when only
// ?id= changes (a list switch is a new page segment to the router), so the
// list bar briefly becomes its skeleton while the other list's stocks load.
export default function Loading() {
  return <WatchlistContentSkeleton />
}
