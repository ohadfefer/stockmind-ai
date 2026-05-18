import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { addToWatchlist, removeFromWatchlist } from "@/services/watchlist/watchlist-items-service"
import { getUserWatchlistsForSymbol } from "@/services/watchlist/watchlist-crud-service"

export async function GET(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")
  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const watchlists = await getUserWatchlistsForSymbol(userId, symbol.toUpperCase())
  return NextResponse.json({ watchlists })
}

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { watchlistId, symbol, add } = await request.json()
  if (!watchlistId || !symbol || typeof add !== "boolean") {
    return NextResponse.json(
      { error: "watchlistId, symbol, and add (boolean) are required" },
      { status: 400 }
    )
  }

  const ok = add
    ? await addToWatchlist(watchlistId, symbol.toUpperCase())
    : await removeFromWatchlist(watchlistId, symbol.toUpperCase())

  if (!ok) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
