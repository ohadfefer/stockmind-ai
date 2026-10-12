import { ApiError, apiFetch, apiRequest, type ApiRequestInit } from "@/actions/http"
import type { FinnhubQuote } from "@/services/stock/stock-service"
import type { SymbolSearchEvent } from "@/services/stock/search-service"

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

/**
 * Yields each line of the search endpoint's NDJSON body as it arrives: the
 * matches first, then the quotes one by one. `init` carries the search hook's
 * per-keystroke AbortSignal, which rejects the pending read when it fires.
 */
export async function* streamSymbolSearch(
  query: string,
  init?: ApiRequestInit,
): AsyncGenerator<SymbolSearchEvent> {
  const path = `/api/stocks/search?q=${encodeURIComponent(query)}`
  const res = await apiRequest(path, init)
  if (!res.body) {
    throw new ApiError(res.status, "empty_stream", "Empty response", `${path} returned no body.`)
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  // A chunk can end mid-line; the unfinished tail waits for the next one.
  let buffered = ""
  while (true) {
    const { done, value } = await reader.read()
    if (done) return
    const lines = (buffered + value).split("\n")
    buffered = lines.pop() ?? ""
    for (const line of lines) {
      if (line) yield JSON.parse(line) as SymbolSearchEvent
    }
  }
}
