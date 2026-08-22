import { NextResponse } from "next/server"
import { withAccount } from "@/lib/http/with-auth"
import { notFound } from "@/lib/http/problem"
import { resolveWatchlistId } from "@/services/watchlist/watchlist-crud-service"
import { getWatchlistSymbolsById } from "@/services/watchlist/watchlist-items-service"

type Params = { id: string }

/**
 * The list's members. An empty list is 200 [] — 404 is reserved for the
 * collection itself not existing, which here means the watchlist.
 */
export const GET = withAccount<Params>(
  async (_request, { accountId }, { params }) => {
    const { id } = await params
    const watchlistId = await resolveWatchlistId(id, accountId)
    if (watchlistId === null) return notFound("Watchlist")

    const symbols = await getWatchlistSymbolsById(watchlistId, accountId)
    return NextResponse.json(symbols.map((symbol) => ({ symbol })))
  },
)
