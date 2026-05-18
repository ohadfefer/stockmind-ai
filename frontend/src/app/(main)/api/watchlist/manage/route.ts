import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { renameWatchlist, deleteWatchlist } from "@/services/watchlist/watchlist-crud-service"

export async function PATCH(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { watchlistId, name } = await request.json()
  if (!watchlistId || !name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "watchlistId and name are required" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const ok = await renameWatchlist(userId, watchlistId, name.trim())
  if (!ok) {
    return NextResponse.json({ error: "Failed to rename" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { watchlistId } = await request.json()
  if (!watchlistId) {
    return NextResponse.json({ error: "watchlistId is required" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const ok = await deleteWatchlist(userId, watchlistId)
  if (!ok) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
