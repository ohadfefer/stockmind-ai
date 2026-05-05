import { finnhubFetch } from "@/lib/finnhub"
import type { WatchlistStockData } from "@/types/watchlist"

const priceCache = new Map<
  string,
  { data: WatchlistStockData; marketWasOpen: boolean }
>()

export async function getMarketIsOpen(): Promise<boolean> {
  try {
    const status = await finnhubFetch("/stock/market-status", {
      exchange: "US",
    })
    const isOpen = (status as { isOpen?: unknown })?.isOpen
    if (typeof isOpen === "boolean") return isOpen
    return true
  } catch (err) {
    console.error("[getMarketIsOpen] failed", err)
    return true
  }
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
