import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getUserWatchlistsWithCounts } from "@/services/watchlist/watchlist-crud-service"
import { getWatchlistSymbolsById } from "@/services/watchlist/watchlist-items-service"
import { getOrCreateDefaultAccount } from "@/services/account/account-service"
import {
  getCachedQuote,
  getCachedProfile,
  getMarketIsOpenCached,
  toWatchlistStockData,
} from "@/services/stock/quote-cache"
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

    const accountId = await getOrCreateDefaultAccount(userId)
    const symbols = await getWatchlistSymbolsById(defaultWatchlistId, accountId)
    const limited = limit === undefined ? symbols : symbols.slice(0, limit)

    const marketIsOpen = await getMarketIsOpenCached()

    // Shares quote-cache's market-aware 60s quote TTL, ~static profile TTL,
    // and per-symbol in-flight dedupe with the watchlist page, so the
    // dashboard's watchlist widget reuses the same snapshot instead of
    // fanning out a Finnhub /quote + /profile2 per symbol per request.
    const stocks = await Promise.all(
      limited.map(async (symbol) => {
        const [quote, profile] = await Promise.all([
          getCachedQuote(symbol, marketIsOpen),
          getCachedProfile(symbol),
        ])
        return toWatchlistStockData(symbol, quote, profile)
      }),
    )

    return stocks
  } catch (err) {
    console.error("[getDashboardWatchlistStocks] failed", err)
    return []
  }
}
