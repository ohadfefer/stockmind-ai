import { NextResponse } from "next/server"
import { withAuth } from "@/lib/http/with-auth"
import { badGateway, invalid } from "@/lib/http/problem"
import { finnhubFetch } from "@/lib/finnhub"

/**
 * Free-text ticker lookup, so isValidSymbol does not apply — the caller is
 * typing and "app" must still match AAPL. The cap is the whole validation:
 * Finnhub ignores anything longer, and it bounds what reaches the upstream URL.
 *
 * `q` is now required. It used to default to "AAPL", which turned a caller's
 * bug into a plausible-looking result set. The only caller (useSymbolSearch)
 * never fires on an empty query.
 */
const MAX_QUERY_LENGTH = 64

export const GET = withAuth(async (request) => {
  const query = new URL(request.url).searchParams.get("q")?.trim()
  if (!query) return invalid("q is required")
  if (query.length > MAX_QUERY_LENGTH) {
    return invalid(`q must be at most ${MAX_QUERY_LENGTH} characters`)
  }

  try {
    return NextResponse.json(await finnhubFetch("/search", { q: query }))
  } catch (err) {
    console.error("[stocks/search] Finnhub failed:", err)
    return badGateway("Symbol search is unavailable right now.")
  }
})
