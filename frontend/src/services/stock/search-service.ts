import { finnhubFetch } from "@/lib/finnhub"
import { getCachedQuote, getMarketIsOpenCached } from "@/services/stock/quote-cache"

// Every match costs a quote lookup, so the cap lives here rather than in the
// client: trimming after the fact would still have paid for the rest.
const MAX_RESULTS = 5

interface FinnhubSearchMatch {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

export interface SymbolSearchMatch {
  symbol: string
  displaySymbol: string
  description: string
}

export interface SymbolQuote {
  price: number
  changePercent: number
}

/**
 * The lines of GET /api/stocks/search's NDJSON body: one `matches` line, then
 * one `quote` line per match in whatever order the quotes resolve. `quote` is
 * null when Finnhub has no price for the symbol (zeroed or failed).
 */
export type SymbolSearchEvent =
  | { type: "matches"; matches: SymbolSearchMatch[] }
  | { type: "quote"; symbol: string; quote: SymbolQuote | null }

/**
 * Finnhub symbol lookup, with each match priced from the shared quote cache.
 * Same shape as the dashboard's loader: it waits only for the matches and
 * hands back one pending quote per match, so the caller can send the list
 * while the prices are still in flight.
 *
 * Throws only if the search itself fails. The quote promises never reject:
 * getCachedQuote and getMarketIsOpenCached both degrade instead of throwing.
 */
export async function loadSymbolSearch(query: string): Promise<{
  matches: SymbolSearchMatch[]
  quotes: Promise<{ symbol: string; quote: SymbolQuote | null }>[]
}> {
  // Started alongside the search so the quotes don't wait on it afterwards.
  const marketOpenPromise = getMarketIsOpenCached()
  // US listings only: the app trades nothing else, and every match costs a
  // quote call. Foreign listings (TL0.DE, TSLA.MX) have no quote on our
  // Finnhub plan, and a failed quote isn't cached, so each one would spend a
  // call on every search that returned it.
  const data: { result?: FinnhubSearchMatch[] } = await finnhubFetch("/search", {
    q: query,
    exchange: "US",
  })

  const matches = (data.result ?? []).slice(0, MAX_RESULTS).map((match) => ({
    symbol: match.symbol,
    displaySymbol: match.displaySymbol,
    description: match.description,
  }))

  const quotes = matches.map(async ({ symbol }) => {
    const quote = await getCachedQuote(symbol, await marketOpenPromise)
    return {
      symbol,
      quote: quote?.c ? { price: quote.c, changePercent: quote.dp } : null,
    }
  })

  return { matches, quotes }
}
