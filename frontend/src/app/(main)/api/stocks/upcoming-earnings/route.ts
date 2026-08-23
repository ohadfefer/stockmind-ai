import { NextResponse } from "next/server"
import { withAuth } from "@/lib/http/with-auth"
import { invalid, notFound } from "@/lib/http/problem"
import { isValidSymbol } from "@/lib/symbol"
import { getUpcomingEarnings } from "@/services/earnings-service"

/**
 * Moved out of /api/alerts: this is a Finnhub read keyed by symbol with no
 * account state behind it, which is what the sibling ?symbol= proxies under
 * /api/stocks already are. The alert dialog happens to be its only caller.
 *
 * withAuth rather than withAccount — no user row is read, and withAccount
 * would provision an account as a side effect of a market-data lookup.
 */
export const GET = withAuth(async (request) => {
  const symbol = new URL(request.url).searchParams.get("symbol")
  if (!isValidSymbol(symbol)) return invalid("Invalid symbol")

  // A symbol with nothing on the calendar has no upcoming-earnings resource,
  // so 404 is the answer rather than a 200 wrapping null. Callers that treat
  // it as a normal outcome opt in with allowStatus.
  const upcoming = await getUpcomingEarnings(symbol.toUpperCase())
  if (!upcoming) return notFound("Upcoming earnings")

  return NextResponse.json(upcoming)
})
