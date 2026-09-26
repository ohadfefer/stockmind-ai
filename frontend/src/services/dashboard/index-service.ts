import { fmpFetch } from "@/lib/fmp"
import { redisTry } from "@/lib/redis"

export interface IndexQuote {
  symbol: string
  name: string
  price: number
  changePercentage: number
  change: number
}

interface FmpQuote {
  symbol: string
  name: string
  price: number
  changePercentage: number
  change: number
  volume: number
  dayLow: number
  dayHigh: number
  yearLow: number
  marketCap: number
  priceAvg50: number
  priceAvg200: number
  exchange: string
  open: number
  previousClose: number
  timestamp: number
}

const INDEX_SYMBOLS = [
  "^GSPC",
  "^DJI",
  "^IXIC",
  "^RUT",
  "^FTSE",
  "^N225",
  "^HSI",
  "^STOXX50E",
  "^VIX",
]

// The whole bar is one Redis entry (lib/redis), so a dashboard render reads
// one key instead of spending nine FMP calls, and every request and ECS task
// shares the same copy. Like quote-cache, Redis is best-effort: redisTry turns
// a failure into a miss, and the bar is fetched from FMP as before.
//
// Freshness is age alone. quote-cache's US market-status rule would freeze
// the Nikkei, Hang Seng, FTSE and STOXX 50, which trade while New York is
// closed.

// FMP's free plan allows 250 calls a day, and a refresh costs nine. Fifteen
// minutes stays well under that at this app's traffic, but not under
// continuous traffic (96 windows × 9 calls); an hour is the window that would.
// If the quota does run out, the stale fallback below keeps the bar showing
// its last values until it resets.
const INDEX_QUOTES_TTL_MS = 15 * 60 * 1000

// A symbol FMP fails on keeps its last good quote for up to a day: long enough
// to ride out a spent daily quota, short enough that a symbol FMP stops
// serving drops off the bar instead of freezing on it.
const STALE_QUOTE_LIMIT_MS = 24 * 60 * 60 * 1000

// Nothing older than the stale limit is ever served, so the key can go then.
const INDEX_QUOTES_MAX_AGE_S = STALE_QUOTE_LIMIT_MS / 1000

const INDEX_QUOTES_KEY = "index-quotes"

type CachedIndexQuote = IndexQuote & { fetchedAt: number }

// checkedAt is the last refresh attempt, successful or not. A refresh FMP
// fails outright still restarts the window, so an outage or a spent quota
// costs nine failing calls per window instead of per render.
type IndexQuotesEntry = { quotes: CachedIndexQuote[]; checkedAt: number }

// Process-local, like quote-cache's in-flight promises: concurrent renders on
// an expired entry share one round of FMP calls.
let inflightIndexQuotes: Promise<IndexQuote[]> | null = null

export async function getIndexQuotes(): Promise<IndexQuote[]> {
  if (inflightIndexQuotes) return inflightIndexQuotes

  const task = loadIndexQuotes().finally(() => {
    inflightIndexQuotes = null
  })
  inflightIndexQuotes = task
  return task
}

async function loadIndexQuotes(): Promise<IndexQuote[]> {
  const cached = await redisTry("get index-quotes", (redis) =>
    redis.get<IndexQuotesEntry>(INDEX_QUOTES_KEY),
  )
  const now = Date.now()
  if (cached && now - cached.checkedAt < INDEX_QUOTES_TTL_MS) {
    return cached.quotes
  }

  const previous = new Map(cached?.quotes.map((q) => [q.symbol, q]))
  const fetched = await Promise.all(INDEX_SYMBOLS.map(fetchIndexQuote))
  const quotes = INDEX_SYMBOLS.flatMap((symbol, i): CachedIndexQuote[] => {
    const fresh = fetched[i]
    if (fresh) return [{ ...fresh, fetchedAt: now }]
    const last = previous.get(symbol)
    return last && now - last.fetchedAt < STALE_QUOTE_LIMIT_MS ? [last] : []
  })

  await redisTry("set index-quotes", (redis) =>
    redis.set<IndexQuotesEntry>(
      INDEX_QUOTES_KEY,
      { quotes, checkedAt: now },
      { ex: INDEX_QUOTES_MAX_AGE_S },
    ),
  )
  return quotes
}

async function fetchIndexQuote(symbol: string): Promise<IndexQuote | null> {
  try {
    const data: unknown = await fmpFetch("/quote", { symbol })
    // A 200 can still carry no quote: an empty array, or an error object in
    // place of one (how the free plan may answer a symbol it doesn't cover).
    const q = Array.isArray(data) ? (data[0] as FmpQuote | undefined) : undefined
    if (!q) {
      console.error(`[getIndexQuotes] ${symbol}: FMP returned no quote`, data)
      return null
    }
    return {
      symbol,
      name: q.name,
      price: q.price,
      changePercentage: q.changePercentage,
      change: q.change,
    }
  } catch (err) {
    console.error(`[getIndexQuotes] ${symbol} failed`, err)
    return null
  }
}
