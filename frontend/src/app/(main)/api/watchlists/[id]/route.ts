import { NextResponse } from "next/server"
import { withAccount } from "@/lib/http/with-auth"
import { invalid, noContent, notFound } from "@/lib/http/problem"
import {
  deleteWatchlist,
  renameWatchlist,
  resolveWatchlistId,
} from "@/services/watchlist/watchlist-crud-service"

const MAX_NAME_LENGTH = 60

type Params = { id: string }

export const PATCH = withAccount<Params>(
  async (request, { accountId }, { params }) => {
    const { id } = await params
    const watchlistId = await resolveWatchlistId(id, accountId)
    if (watchlistId === null) return notFound("Watchlist")

    const body = await request.json().catch(() => null)
    const raw = (body as { name?: unknown } | null)?.name
    const name = typeof raw === "string" ? raw.trim() : ""

    if (!name) return invalid("name is required")
    if (name.length > MAX_NAME_LENGTH) {
      return invalid(`name must be ${MAX_NAME_LENGTH} characters or fewer`)
    }

    const renamed = await renameWatchlist(accountId, watchlistId, name)
    if (!renamed) return notFound("Watchlist")

    return NextResponse.json({ id: watchlistId, name })
  },
)

export const DELETE = withAccount<Params>(
  async (_request, { accountId }, { params }) => {
    const { id } = await params
    const watchlistId = await resolveWatchlistId(id, accountId)
    if (watchlistId === null) return notFound("Watchlist")

    const deleted = await deleteWatchlist(accountId, watchlistId)
    if (!deleted) return notFound("Watchlist")

    return noContent()
  },
)
