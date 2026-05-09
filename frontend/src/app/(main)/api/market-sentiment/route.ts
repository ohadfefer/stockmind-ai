import { NextResponse } from "next/server"
import { getMarketSentiment } from "@/services/dashboard/market-sentiment-service"

const ONE_DAY_SECONDS = 24 * 60 * 60

// Reuses Next's data cache via getMarketSentiment(), so this route hits CNN at
// most once per day per deployment. The Cache-Control header lets any CDN /
// browser sitting in front cache the response for the same window.
export async function GET() {
  const sentiment = await getMarketSentiment()
  if (!sentiment) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  }
  return NextResponse.json(sentiment, {
    headers: {
      "Cache-Control": `public, max-age=${ONE_DAY_SECONDS}, stale-while-revalidate=3600`,
    },
  })
}
