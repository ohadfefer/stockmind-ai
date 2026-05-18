import {
  getCachedQuote,
  getMarketIsOpenCached,
} from "@/services/stock/quote-cache"

export interface EtfQuote {
  ticker: string
  price: number
  changePercent: number
}

export async function getEtfQuote(ticker: string): Promise<EtfQuote | null> {
  try {
    const marketIsOpen = await getMarketIsOpenCached()
    // Shares quote-cache's market-aware 60s quote TTL and per-symbol
    // in-flight dedupe with the watchlist/dashboard paths. No profile
    // fetch — the benchmark bar only needs price and % change.
    const quote = await getCachedQuote(ticker, marketIsOpen)
    if (quote == null || !quote.c) return null
    return { ticker, price: quote.c, changePercent: quote.dp }
  } catch (err) {
    console.error(`[getEtfQuote] failed for ${ticker}`, err)
    return null
  }
}
