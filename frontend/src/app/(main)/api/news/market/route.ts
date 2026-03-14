import { finnhubFetch } from "@/lib/finnhub"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const minId = searchParams.get("minId")

  try {
    const category = searchParams.get("category") || "general"
    const params: Record<string, string> = { category }
    if (minId) params.minId = minId

    const data = await finnhubFetch("/news", params)
    const items = Array.isArray(data) ? data.slice(0, 7) : data
    return NextResponse.json(items)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch market news" },
      { status: 500 }
    )
  }
}
