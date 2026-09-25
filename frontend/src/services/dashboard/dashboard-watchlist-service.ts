import { getWatchlists } from "@/services/watchlist/watchlist-crud-service"
import { getWatchlistSymbolsById } from "@/services/watchlist/watchlist-items-service"
import {
  getCachedQuote,
  getCachedProfile,
  getMarketIsOpenCached,
  toWatchlistStockData,
} from "@/services/stock/quote-cache"
import type { WatchlistStockData } from "@/types/watchlist"

// Takes the accountId the dashboard already resolved, rather than walking
// session → user → account again on its own.
export async function getDashboardWatchlistStocks(
  accountId: number,
  limit?: number
): Promise<WatchlistStockData[]> {
  try {
    const watchlists = await getWatchlists(accountId)
    const defaultWatchlistId = watchlists[0]?.id
    if (!defaultWatchlistId) return []

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
