import { NextResponse } from "next/server"
import { withAccount } from "@/lib/http/with-auth"
import { created, invalid } from "@/lib/http/problem"
import {
  createWatchlist,
  getWatchlists,
} from "@/services/watchlist/watchlist-crud-service"

const MAX_NAME_LENGTH = 60

/**
 * Every list on the account.
 *
 * ?symbol=AAPL annotates each row with containsSymbol; it does not filter
 * them. The picker needs the lists that *don't* hold the symbol too, so it can
 * render them unchecked — a parameter that dropped those rows would be a
 * filter wearing an annotation's name.
 */
export const GET = withAccount(async (request, { accountId }) => {
  const symbol = new URL(request.url).searchParams.get("symbol")
  const watchlists = await getWatchlists(
    accountId,
    symbol ? symbol.toUpperCase() : undefined,
  )
  return NextResponse.json(watchlists)
})

export const POST = withAccount(async (request, { accountId }) => {
  const body = await request.json().catch(() => null)
  const raw = (body as { name?: unknown } | null)?.name
  const name = typeof raw === "string" ? raw.trim() : ""

  if (!name) return invalid("name is required")
  if (name.length > MAX_NAME_LENGTH) {
    return invalid(`name must be ${MAX_NAME_LENGTH} characters or fewer`)
  }

  const id = await createWatchlist(accountId, name)
  return created(`/api/watchlists/${id}`, { id, name })
})
