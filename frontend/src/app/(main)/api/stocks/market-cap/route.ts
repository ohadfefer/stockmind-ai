import { finnhubFetch } from "@/lib/finnhub"
import { Converter } from "easy-currencies"
import { NextResponse } from "next/server"
import { formatMarketCap } from "@/services/stock-service"
import type { FinnhubProfile } from "@/services/stock-service"

const converter = new Converter()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  try {
    const profile = (await finnhubFetch("/stock/profile2", {
      symbol,
    })) as FinnhubProfile

    const mcRaw = profile?.marketCapitalization
    if (!mcRaw) {
      return NextResponse.json({ marketCap: null })
    }

    const currency = profile.currency ?? "USD"
    let mcInUsdMillions = mcRaw

    if (currency !== "USD") {
      mcInUsdMillions = await converter.convert(mcRaw, currency, "USD")
    }

    return NextResponse.json({
      marketCap: formatMarketCap(mcInUsdMillions),
      currency,
      converted: currency !== "USD",
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch market cap" },
      { status: 500 }
    )
  }
}
