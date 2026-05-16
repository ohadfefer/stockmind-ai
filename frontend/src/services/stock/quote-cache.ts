import { finnhubFetch } from "@/lib/finnhub"
import type { FinnhubQuote, FinnhubProfile } from "@/services/stock/stock-service"

// Module-scoped caches. Like inflightReviews in portfolio-review-service, these
// outlive the request that populated them, so concurrent requests and the
// client's 60s poll reuse a snapshot instead of fanning out Finnhub calls.

const MARKET_STATUS_TTL_MS = 30_000
const PROFILE_TTL_MS = 24 * 60 * 60 * 1000 // name/sector are effectively static
const QUOTE_TTL_MS = 60_000 // live refresh cadence while the market is open

let marketStatus: { isOpen: boolean; fetchedAt: number } | null = null
let inflightMarketStatus: Promise<boolean> | null = null

/**
 * US market open/closed, cached for 30s so frequent polls don't each spend a
 * Finnhub /stock/market-status call. Concurrent misses share one in-flight
 * request. Fails open (assume open) so a status outage degrades to fetching
 * fresh prices rather than freezing stale ones.
 */
export async function getMarketIsOpenCached(): Promise<boolean> {
  if (
    marketStatus &&
    Date.now() - marketStatus.fetchedAt < MARKET_STATUS_TTL_MS
  ) {
    return marketStatus.isOpen
  }
  if (inflightMarketStatus) return inflightMarketStatus

  inflightMarketStatus = finnhubFetch("/stock/market-status", {
    exchange: "US",
  })
    .then((status) => {
      const raw = (status as { isOpen?: unknown })?.isOpen
      const isOpen = typeof raw === "boolean" ? raw : true
      marketStatus = { isOpen, fetchedAt: Date.now() }
      return isOpen
    })
    .catch((err): boolean => {
      console.error("[getMarketIsOpenCached] failed", err)
      return marketStatus?.isOpen ?? true
    })
    .finally(() => {
      inflightMarketStatus = null
    })

  return inflightMarketStatus
}

const profileCache = new Map<
  string,
  { profile: FinnhubProfile | null; fetchedAt: number }
>()
const inflightProfiles = new Map<string, Promise<FinnhubProfile | null>>()

/** Company profile (name/sector). Long TTL — these barely ever change. */
export async function getCachedProfile(
  symbol: string,
): Promise<FinnhubProfile | null> {
  const cached = profileCache.get(symbol)
  if (cached && Date.now() - cached.fetchedAt < PROFILE_TTL_MS) {
    return cached.profile
  }

  const existing = inflightProfiles.get(symbol)
  if (existing) return existing

  const task = finnhubFetch("/stock/profile2", { symbol })
    .then((profile: FinnhubProfile) => {
      profileCache.set(symbol, { profile, fetchedAt: Date.now() })
      return profile
    })
    .catch((err): FinnhubProfile | null => {
      console.error(`[getCachedProfile] ${symbol} failed`, err)
      return cached?.profile ?? null
    })
    .finally(() => inflightProfiles.delete(symbol))

  inflightProfiles.set(symbol, task)
  return task
}

const quoteCache = new Map<
  string,
  { quote: FinnhubQuote | null; marketWasOpen: boolean; fetchedAt: number }
>()
const inflightQuotes = new Map<string, Promise<FinnhubQuote | null>>()

/**
 * Live quote with market-aware refresh:
 * - market open  → serve cache for QUOTE_TTL_MS, then refetch (1/min).
 * - market closed → serve cache only if the snapshot was also taken while
 *   closed. A snapshot taken while open (the open→close transition) or no
 *   snapshot triggers exactly one refetch to capture the official close,
 *   after which closed reads are served from cache until the market reopens.
 */
export async function getCachedQuote(
  symbol: string,
  marketOpen: boolean,
): Promise<FinnhubQuote | null> {
  const cached = quoteCache.get(symbol)
  if (cached) {
    if (marketOpen) {
      if (Date.now() - cached.fetchedAt < QUOTE_TTL_MS) return cached.quote
    } else if (!cached.marketWasOpen) {
      return cached.quote
    }
  }

  const existing = inflightQuotes.get(symbol)
  if (existing) return existing

  const task = finnhubFetch("/quote", { symbol })
    .then((quote: FinnhubQuote) => {
      quoteCache.set(symbol, {
        quote,
        marketWasOpen: marketOpen,
        fetchedAt: Date.now(),
      })
      return quote
    })
    .catch((err): FinnhubQuote | null => {
      console.error(`[getCachedQuote] ${symbol} failed`, err)
      return cached?.quote ?? null
    })
    .finally(() => inflightQuotes.delete(symbol))

  inflightQuotes.set(symbol, task)
  return task
}
