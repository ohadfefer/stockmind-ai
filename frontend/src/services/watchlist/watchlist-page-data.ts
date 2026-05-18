import { resolveAccountContext } from "@/services/account-context"
import { getUserWatchlistsWithCounts } from "@/services/watchlist/watchlist-crud-service"
import { getWatchlistSymbolsById } from "@/services/watchlist/watchlist-items-service"
import { getStockQuote } from "@/services/stock/stock-service"
import {
  getMarketIsOpen,
  getOrFetchPrice,
} from "@/services/stock/stock-price-cache"
import type { WatchlistStockData, WatchlistInfo } from "@/types/watchlist"

export interface WatchlistStocks {
  stocks: WatchlistStockData[]
  activeWatchlistId?: number
}

export interface WatchlistPageData {
  watchlistsPromise: Promise<WatchlistInfo[]>
  stocksPromise: Promise<WatchlistStocks>
}

// Logs with context (so the server retains the real error) then rethrows so
// the promise still rejects. We deliberately do NOT swallow into defaults: a
// transient DB/Finnhub failure must surface as an error state, not as a
// legitimate-looking empty watchlist. The only "empty" path is a genuine
// null context (no session/account), handled inline below.
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

async function loadWatchlistStocks(
  activeWatchlistId: number,
  accountId: number,
): Promise<WatchlistStocks> {
  const symbols = await getWatchlistSymbolsById(activeWatchlistId, accountId)
  const marketIsOpen = await getMarketIsOpen()

  const stocks = await Promise.all(
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

  return { stocks, activeWatchlistId }
}

/**
 * Kicks off watchlist data fetching without blocking the page render.
 * Returns one promise per visual section so each can stream in under its own
 * Suspense boundary. The auth/account chain is resolved once and shared
 * between the watchlist tab bar and the active list's stock table.
 *
 * The active list is `idParam` when present, else the first watchlist — so
 * the stock table depends on the resolved watchlist list. Genuine "no account"
 * (null context) resolves to safe empties. Real failures reject so the
 * section's error boundary renders a retryable state instead of a misleading
 * empty watchlist.
 */
export function loadWatchlistPageData(idParam?: number): WatchlistPageData {
  const ctxPromise = resolveAccountContext().catch(
    logAndRethrow("watchlist context resolve failed"),
  )

  const watchlistsPromise = ctxPromise.then((ctx) =>
    ctx
      ? getUserWatchlistsWithCounts(ctx.userId).catch(
          logAndRethrow("watchlists fetch failed"),
        )
      : ([] as WatchlistInfo[]),
  )

  const stocksPromise = Promise.all([ctxPromise, watchlistsPromise]).then(
    ([ctx, watchlists]) => {
      if (!ctx) return { stocks: [], activeWatchlistId: undefined }
      // Only honor an explicit ?id= if it belongs to this account's
      // watchlists (the list is already account-scoped). A foreign or
      // bogus id falls back to the first list instead of leaking another
      // account's tickers — see also the account-scoped query.
      const requested =
        idParam != null && watchlists.some((w) => w.id === idParam)
          ? idParam
          : undefined
      const activeWatchlistId = requested ?? watchlists[0]?.id
      if (!activeWatchlistId)
        return { stocks: [], activeWatchlistId: undefined }
      return loadWatchlistStocks(activeWatchlistId, ctx.accountId).catch(
        logAndRethrow("watchlist stocks failed"),
      )
    },
  )

  return { watchlistsPromise, stocksPromise }
}
