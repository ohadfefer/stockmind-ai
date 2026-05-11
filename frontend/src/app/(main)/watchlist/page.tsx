import { WatchlistTab } from "@/components/watchlist/watchlist-tab"
import { WatchlistListBar } from "@/components/watchlist/watchlist-list-bar"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getWatchlistSymbolsById } from "@/services/watchlist-items-service"
import { getUserWatchlistsWithCounts } from "@/services/watchlist-crud-service"
import { getStockQuote } from "@/services/stock/stock-service"
import {
  getMarketIsOpen,
  getOrFetchPrice,
} from "@/services/stock/stock-price-cache"
import type { WatchlistStockData, WatchlistInfo } from "@/types/watchlist"

export default async function WatchlistPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const session = await auth0.getSession()
  const auth0Id = session?.user?.sub

  let stocks: WatchlistStockData[] = []
  let watchlists: WatchlistInfo[] = []

  if (auth0Id) {
    const userId = await getUserIdByAuth0Id(auth0Id)
    if (userId) {
      watchlists = await getUserWatchlistsWithCounts(userId)
      const activeWatchlistId = id ? Number(id) : watchlists[0]?.id

      if (activeWatchlistId) {
        const symbols = await getWatchlistSymbolsById(activeWatchlistId)
        const marketIsOpen = await getMarketIsOpen()

        stocks = await Promise.all(
          symbols.map((symbol) =>
            getOrFetchPrice(symbol, marketIsOpen, async () => {
              const data = await getStockQuote(symbol)
              return {
                ticker: symbol,
                company: data.name,
                price: data.price,
                changeDollar: data.changeDollar,
                changePercent: data.changePercent,
                marketCap: null,
                dayLow: data.dayLow || null,
                dayHigh: data.dayHigh || null,
                aiScore: null,
              }
            }),
          ),
        )
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <WatchlistListBar watchlists={watchlists} />
      <WatchlistTab stocks={stocks} watchlistId={id ? Number(id) : watchlists[0]?.id} />
    </div>
  )
}
