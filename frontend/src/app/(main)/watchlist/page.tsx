import { loadWatchlistPageData } from "@/services/watchlist/watchlist-page-data"
import { WatchlistContent } from "@/components/watchlist/watchlist-content"

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const { watchlistsPromise, stocksPromise } = loadWatchlistPageData(
    id ? Number(id) : undefined,
  )

  return (
    <WatchlistContent
      watchlistsPromise={watchlistsPromise}
      stocksPromise={stocksPromise}
    />
  )
}
