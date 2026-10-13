import { withAuth } from "@/lib/http/with-auth"
import { badGateway, invalid } from "@/lib/http/problem"
import { loadSymbolSearch, type SymbolSearchEvent } from "@/services/stock/search-service"

/**
 * Free-text ticker lookup, so isValidSymbol does not apply — the caller is
 * typing and "app" must still match AAPL. The cap is the whole validation:
 * Finnhub ignores anything longer, and it bounds what reaches the upstream URL.
 *
 * `q` is now required. It used to default to "AAPL", which turned a caller's
 * bug into a plausible-looking result set. The only caller (useSymbolSearch)
 * never fires on an empty query.
 *
 * Streams NDJSON (see SymbolSearchEvent): the matches as soon as Finnhub
 * answers, then each quote as it resolves. One response rather than a second
 * request for the quotes, which would add a full browser round trip before
 * any price could show. A search failure is still a plain 502 problem, since
 * nothing has been streamed by then.
 *
 * Quotes are opt-in with `quotes=true`, since each costs a lookup. Without
 * it the body is the matches line alone.
 */
const MAX_QUERY_LENGTH = 64

export const GET = withAuth(async (request) => {
  const params = new URL(request.url).searchParams
  const query = params.get("q")?.trim()
  if (!query) return invalid("q is required")
  if (query.length > MAX_QUERY_LENGTH) {
    return invalid(`q must be at most ${MAX_QUERY_LENGTH} characters`)
  }
  const withQuotes = params.get("quotes") === "true"

  let search: Awaited<ReturnType<typeof loadSymbolSearch>>
  try {
    search = await loadSymbolSearch(query, withQuotes)
  } catch (err) {
    console.error("[stocks/search] Finnhub failed:", err)
    return badGateway("Symbol search is unavailable right now.")
  }

  const encoder = new TextEncoder()
  // The client aborts on its next keystroke, and enqueueing into a cancelled
  // stream throws, so every write checks this first.
  let open = true
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SymbolSearchEvent) => {
        if (open) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }
      send({ type: "matches", matches: search.matches })
      await Promise.all(
        search.quotes.map((pending) =>
          pending.then(({ symbol, quote }) => send({ type: "quote", symbol, quote })),
        ),
      )
      if (open) controller.close()
    },
    cancel() {
      open = false
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
})
