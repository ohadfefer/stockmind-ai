import { NextResponse } from "next/server"
import { withAuth } from "@/lib/http/with-auth"
import { badGateway, invalid } from "@/lib/http/problem"
import { isValidSymbol } from "@/lib/symbol"
import { finnhubFetch } from "@/lib/finnhub"

/**
 * withAuth, not withAccount — a market-data read must not provision an
 * account as a side effect. Same call as /api/stocks/upcoming-earnings.
 *
 * A Finnhub failure is 502, not 500: the request was fine and nothing here
 * went wrong, so a caller that retries is doing the right thing. The old
 * handler answered 500 for both, which told the client to give up.
 */
export const GET = withAuth(async (request) => {
  const symbol = new URL(request.url).searchParams.get("symbol")
  if (!isValidSymbol(symbol)) return invalid("Invalid symbol")

  try {
    return NextResponse.json(await finnhubFetch("/quote", { symbol: symbol.toUpperCase() }))
  } catch (err) {
    console.error(`[stocks/quote] Finnhub failed for ${symbol}:`, err)
    return badGateway("Could not fetch a quote for that symbol.")
  }
})
