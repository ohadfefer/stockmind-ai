import { WatchlistTab } from "@/components/watchlist/watchlist-tab"
import { WatchlistListBar } from "@/components/watchlist/watchlist-list-bar"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getUserWatchlistsWithCounts, getWatchlistSymbolsById } from "@/services/watchlist-service"
import { getStockData } from "@/services/stock-service"
import { finnhubFetch } from "@/lib/finnhub"
import type { WatchlistStockData, WatchlistInfo } from "@/types/watchlist"

// Cache market data per symbol (not the symbol list) so unfollows are reflected immediately
const priceCache = new Map<string, { data: WatchlistStockData; marketWasOpen: boolean }>()

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
        const status = await finnhubFetch("/stock/market-status", { exchange: "US" }) as { isOpen: boolean }
        const marketIsOpen = status.isOpen

        stocks = await Promise.all(
          symbols.map(async (symbol) => {
            const cached = priceCache.get(symbol)
            if (cached && !marketIsOpen && !cached.marketWasOpen) {
              return cached.data
            }

            const data = await getStockData(symbol)
            const entry: WatchlistStockData = {
              ticker: symbol,
              company: data.name,
              price: data.price,
              changeDollar: data.changeDollar,
              changePercent: data.changePercent,
              marketCap: data.keyStats.marketCap,
              dayLow: data.dayLow || null,
              dayHigh: data.dayHigh || null,
              aiScore: null,
            }
            priceCache.set(symbol, { data: entry, marketWasOpen: marketIsOpen })
            return entry
          })
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
