import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getUserWatchlistsWithCounts } from "@/services/watchlist-crud-service"
import { getWatchlistSymbolsById } from "@/services/watchlist-items-service"
import { getStockData } from "@/services/stock/stock-service"
import {
  getMarketIsOpen,
  getOrFetchPrice,
} from "@/services/stock/stock-price-cache"
import type { WatchlistStockData } from "@/types/watchlist"

export async function getDashboardWatchlistStocks(
  limit?: number
): Promise<WatchlistStockData[]> {
  try {
    const session = await auth0.getSession()
    const auth0Id = session?.user?.sub
    if (!auth0Id) return []

    const userId = await getUserIdByAuth0Id(auth0Id)
    if (!userId) return []

    const watchlists = await getUserWatchlistsWithCounts(userId)
    const defaultWatchlistId = watchlists[0]?.id
    if (!defaultWatchlistId) return []

    const symbols = await getWatchlistSymbolsById(defaultWatchlistId)
    const limited = limit === undefined ? symbols : symbols.slice(0, limit)

    const marketIsOpen = await getMarketIsOpen()

    const stocks = await Promise.all(
      limited.map((symbol) =>
        getOrFetchPrice(symbol, marketIsOpen, async () => {
          const data = await getStockData(symbol, { skipMarketCap: true })
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

    return stocks
  } catch (err) {
    console.error("[getDashboardWatchlistStocks] failed", err)
    return []
  }
}
