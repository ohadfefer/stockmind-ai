import { apiFetch, type ApiRequestInit } from "@/actions/http"
import type { FinnhubQuote } from "@/services/stock/stock-service"

/**
 * `init` exists for the caller's AbortSignal: the trade forms fire this on a
 * debounce as the user types, and a superseded request that lands late would
 * otherwise paint the previous symbol's price over the current one.
 */
export async function fetchQuote(
  symbol: string,
  init?: ApiRequestInit,
): Promise<FinnhubQuote> {
  return apiFetch<FinnhubQuote>(
    `/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`,
    init,
  )
}
