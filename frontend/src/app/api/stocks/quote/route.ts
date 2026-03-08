import { finnhubFetch } from "@/lib/finnhub"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  try {
    const [quote, profile] = await Promise.all([
      finnhubFetch("/quote", { symbol }),
      finnhubFetch("/stock/profile2", { symbol }),
    ])

    return NextResponse.json({ quote, profile })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 }
    )
  }
}
