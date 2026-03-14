import { finnhubFetch } from "@/lib/finnhub"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const from = searchParams.get("from") || twoDaysAgo.toISOString().split("T")[0]
  const to = searchParams.get("to") || now.toISOString().split("T")[0]

  try {
    const data = await finnhubFetch("/company-news", { symbol, from, to })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch company news" },
      { status: 500 }
    )
  }
}
