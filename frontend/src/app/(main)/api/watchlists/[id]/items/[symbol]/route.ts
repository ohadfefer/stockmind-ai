import { withAccount } from "@/lib/http/with-auth"
import { created, invalid, noContent, notFound } from "@/lib/http/problem"
import { SYMBOL_RE } from "@/lib/symbol"
import { resolveWatchlistId } from "@/services/watchlist/watchlist-crud-service"
import {
  addToWatchlist,
  removeFromWatchlist,
} from "@/services/watchlist/watchlist-items-service"

type Params = { id: string; symbol: string }

/**
 * Membership as a resource: the client knows the identity (this symbol, in
 * this list), so PUT and DELETE address it directly. Re-adding a symbol is
 * idempotent because PUT is, not because the handler special-cases it.
 */
export const PUT = withAccount<Params>(
  async (_request, { accountId }, { params }) => {
    const { id, symbol: rawSymbol } = await params
    // Next decodes dynamic segments before params, so no decode here: a
    // second one throws URIError on a stray %, turning a 400 into a 500.
    const symbol = rawSymbol.toUpperCase()
    if (!SYMBOL_RE.test(symbol)) return invalid("Invalid symbol")

    const watchlistId = await resolveWatchlistId(id, accountId)
    if (watchlistId === null) return notFound("Watchlist")

    const isNew = await addToWatchlist(watchlistId, accountId, symbol)
    return isNew
      ? created(`/api/watchlists/${watchlistId}/items/${symbol}`)
      : noContent()
  },
)

export const DELETE = withAccount<Params>(
  async (_request, { accountId }, { params }) => {
    const { id, symbol: rawSymbol } = await params
    // Next decodes dynamic segments before params, so no decode here: a
    // second one throws URIError on a stray %, turning a 400 into a 500.
    const symbol = rawSymbol.toUpperCase()
    if (!SYMBOL_RE.test(symbol)) return invalid("Invalid symbol")

    const watchlistId = await resolveWatchlistId(id, accountId)
    if (watchlistId === null) return notFound("Watchlist")

    // DELETE is idempotent: removing a symbol that isn't there is a success,
    // not a 404. Only the list itself missing earns one.
    await removeFromWatchlist(watchlistId, accountId, symbol)
    return noContent()
  },
)
