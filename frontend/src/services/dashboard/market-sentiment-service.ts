const CNN_FEAR_GREED_URL =
  "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"

const ONE_DAY_SECONDS = 24 * 60 * 60

export type SentimentTone = "bearish" | "neutral" | "bullish"

export interface MarketSentiment {
  rating: string
  score: number
}

export interface SentimentLabel {
  label: string
  description: string
  tone: SentimentTone
}

/**
 * Fetches CNN's Fear & Greed index. Cached via Next's data cache for 24h so we
 * issue at most one upstream request per day per deployment — CNN's endpoint
 * is unauthenticated and IP-rate-limited.
 */
export async function getMarketSentiment(): Promise<MarketSentiment | null> {
  try {
    const res = await fetch(CNN_FEAR_GREED_URL, {
      // CNN's edge returns 418 ("I'm a teapot. You're a bot.") for empty or
      // generic UAs. A real browser UA + Origin/Referer pinned to cnn.com
      // gets through. The endpoint is unauthenticated and public.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.cnn.com",
        Referer: "https://www.cnn.com/",
      },
      next: { revalidate: ONE_DAY_SECONDS, tags: ["market-sentiment"] },
    })
    if (!res.ok) return null
    const data = await res.json()
    const rating = data?.fear_and_greed?.rating
    const score = Number(data?.fear_and_greed?.score)
    if (typeof rating !== "string" || Number.isNaN(score)) return null
    return { rating: rating.toLowerCase().trim(), score }
  } catch (err) {
    console.error("getMarketSentiment failed", err)
    return null
  }
}

export function describeSentiment(rating: string): SentimentLabel | null {
  switch (rating.toLowerCase().trim()) {
    case "extreme fear":
      return { label: "Extreme Fear", description: "Very Bearish", tone: "bearish" }
    case "fear":
      return { label: "Fear", description: "Bearish", tone: "bearish" }
    case "neutral":
      return { label: "Neutral", description: "Neutral", tone: "neutral" }
    case "greed":
      return { label: "Greed", description: "Bullish", tone: "bullish" }
    case "extreme greed":
      return { label: "Extreme Greed", description: "Very Bullish", tone: "bullish" }
    default:
      return null
  }
}
