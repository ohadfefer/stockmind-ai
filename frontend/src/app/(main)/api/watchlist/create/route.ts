import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { createWatchlist } from "@/services/watchlist/watchlist-crud-service"

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name } = await request.json()
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const id = await createWatchlist(userId, name.trim())
  return NextResponse.json({ id, name: name.trim() })
}
