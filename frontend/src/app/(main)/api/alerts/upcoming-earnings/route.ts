import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUpcomingEarnings } from "@/services/earnings-service"
import { isValidSymbol } from "@/services/alerts/alerts-service"

export async function GET(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const symbol = new URL(request.url).searchParams.get("symbol")
  if (!isValidSymbol(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })
  }

  const upcoming = await getUpcomingEarnings(symbol)
  return NextResponse.json({ upcoming })
}
