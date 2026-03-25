import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getSectorPerformance } from "@/services/dashboard/sector-service"

export async function GET(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") === "1W" ? "1W" : "1D"

  const sectors = await getSectorPerformance(period)
  return NextResponse.json(sectors)
}
