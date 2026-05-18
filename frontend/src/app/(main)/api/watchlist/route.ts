import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import {
  isFollowing,
  addToWatchlist,
  removeFromWatchlist,
} from "@/services/watchlist/watchlist-items-service"
import { getDefaultWatchlistId } from "@/services/watchlist/watchlist-crud-service"

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
    return NextResponse.json({ following: false })
  }

  const following = await isFollowing(userId, symbol.toUpperCase())
  return NextResponse.json({ following })
}

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { symbol } = await request.json()
  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const watchlistId = await getDefaultWatchlistId(userId)
  const ok = await addToWatchlist(watchlistId, symbol.toUpperCase())
  if (!ok) {
    return NextResponse.json({ error: "Failed to add" }, { status: 500 })
  }
  return NextResponse.json({ following: true })
}

export async function DELETE(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { symbol, watchlistId: wlId } = await request.json()
  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const watchlistId = wlId ?? await getDefaultWatchlistId(userId)
  const ok = await removeFromWatchlist(watchlistId, symbol.toUpperCase())
  if (!ok) {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 })
  }
  return NextResponse.json({ following: false })
}
