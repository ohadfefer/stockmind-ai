import type { WatchlistStockData } from "@/types/watchlist"
import { getMarketIsOpenCached } from "@/services/stock/quote-cache"

const priceCache = new Map<
  string,
  { data: WatchlistStockData; marketWasOpen: boolean }
>()

// Single source of truth — shares the 30s cache and in-flight dedupe in
// quote-cache instead of spending a Finnhub /stock/market-status call per
// watchlist request (and avoids the two paths disagreeing across a transition).
export async function getMarketIsOpen(): Promise<boolean> {
  return getMarketIsOpenCached()
}

export async function getOrFetchPrice(
  symbol: string,
  marketIsOpen: boolean,
  fetcher: () => Promise<WatchlistStockData>,
): Promise<WatchlistStockData> {
  const cached = priceCache.get(symbol)
  if (cached && !marketIsOpen && !cached.marketWasOpen) {
    return cached.data
  }
  const data = await fetcher()
  priceCache.set(symbol, { data, marketWasOpen: marketIsOpen })
  return data
}
