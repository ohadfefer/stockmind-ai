import { finnhubFetch } from "@/lib/finnhub"
import { redisTry } from "@/lib/redis"
import type { FinnhubQuote, FinnhubProfile } from "@/services/stock/stock-service"
import type { WatchlistStockData } from "@/types/watchlist"

/**
 * Single source of truth for shaping a cached quote + profile into the row
 * model shared by the watchlist table and the dashboard watchlist widget.
 * A missing or zeroed quote yields a zeroed row rather than an error, so one
 * bad ticker degrades only its own row. Keep both surfaces calling this so
 * they can't drift.
 */
export function toWatchlistStockData(
  symbol: string,
  quote: FinnhubQuote | null,
  profile: FinnhubProfile | null,
): WatchlistStockData {
  const company = profile?.name ?? symbol.toUpperCase()
  if (quote == null || quote.c === 0) {
    return {
      ticker: symbol,
      company,
      price: 0,
      changeDollar: 0,
      changePercent: 0,
      marketCap: null,
      open: null,
      dayLow: null,
      dayHigh: null,
      aiScore: null,
    }
  }
  return {
    ticker: symbol,
    company,
    price: quote.c,
    changeDollar: quote.d,
    changePercent: quote.dp,
    marketCap: null,
    open: quote.o || null,
    dayLow: quote.l || null,
    dayHigh: quote.h || null,
    aiScore: null,
  }
}

// The cached snapshots live in Redis (lib/redis), so every request, every
// poll and every ECS task reads one shared copy instead of each process
// warming its own from Finnhub. Redis is best-effort here: redisTry turns any
// failure into `undefined`, which reads exactly like a miss — we go to
// Finnhub and the page renders either way.
//
// Freshness is decided from the entry's fetchedAt, not from the key's expiry.
// The closed-market rule ("keep serving this snapshot until the market
// reopens") isn't expressible as a TTL, and a Finnhub failure falls back to
// whatever is cached however old it is, so an entry has to outlive the window
// in which it counts as fresh. The EX values are only a garbage-collection
// ceiling for symbols nobody looks at any more.

const MARKET_STATUS_TTL_MS = 30_000
const PROFILE_TTL_MS = 24 * 60 * 60 * 1000 // name/sector are effectively static
const QUOTE_TTL_MS = 60_000 // live refresh cadence while the market is open

// Ceiling on serving a closed-market snapshot. marketWasOpen alone can't carry
// that decision: a snapshot taken after Monday's close still reads as "taken
// while closed" on Tuesday evening, and would be served in place of Tuesday's
// close for as long as the key lives whenever nobody happened to load the
// symbol during Tuesday's session. The bound has to be short enough that a
// snapshot can never outlive a close it predates — the tightest gap is from
// the last pre-open moment (09:30 ET, which still reads closed) to an
// early-close session at 13:00 ET, so three hours sits under that 3h30m.
const CLOSED_QUOTE_TTL_MS = 3 * 60 * 60 * 1000

const MARKET_STATUS_MAX_AGE_S = 60 * 60
const PROFILE_MAX_AGE_S = 7 * 24 * 60 * 60
const QUOTE_MAX_AGE_S = 7 * 24 * 60 * 60

// A zeroed quote is Finnhub saying it has no data for the symbol — an unknown
// or delisted ticker answers 200 with c: 0 (and null d/dp) rather than an
// error, so finnhubFetch can't reject on it. Keep it only long enough that a
// dead ticker sitting on a watchlist doesn't cost an API call per render:
// under the shared cache it would otherwise be handed to every user, and the
// closed-market rule would serve those zeros for three hours.
const EMPTY_QUOTE_MAX_AGE_S = 5 * 60

const MARKET_STATUS_KEY = "market-status:US"
const profileKey = (symbol: string) => `profile:${symbol}`
const quoteKey = (symbol: string) => `quote:${symbol}`

// The in-flight promises stay in the process — they're how concurrent callers
// share one Finnhub call, and a pending promise can't be handed through
// Redis. Each one now covers the cache read as well as the fetch, so a second
// caller arriving during the Redis round-trip, or in the gap between
// Finnhub's answer and the write-back, joins it instead of starting its own.

type MarketStatusEntry = { isOpen: boolean; fetchedAt: number }
type ProfileEntry = { profile: FinnhubProfile | null; fetchedAt: number }
type QuoteEntry = {
  quote: FinnhubQuote | null
  marketWasOpen: boolean
  fetchedAt: number
}

let inflightMarketStatus: Promise<boolean> | null = null

/**
 * US market open/closed, cached for 30s so frequent polls don't each spend a
 * Finnhub /stock/market-status call. Concurrent misses share one in-flight
 * request. Fails open (assume open) so a status outage degrades to fetching
 * fresh prices rather than freezing stale ones.
 */
export async function getMarketIsOpenCached(): Promise<boolean> {
  if (inflightMarketStatus) return inflightMarketStatus

  const task = loadMarketIsOpen().finally(() => {
    inflightMarketStatus = null
  })
  inflightMarketStatus = task
  return task
}

async function loadMarketIsOpen(): Promise<boolean> {
  const cached = await redisTry("get market-status", (redis) =>
    redis.get<MarketStatusEntry>(MARKET_STATUS_KEY),
  )
  if (cached && Date.now() - cached.fetchedAt < MARKET_STATUS_TTL_MS) {
    return cached.isOpen
  }

  try {
    const status = await finnhubFetch("/stock/market-status", {
      exchange: "US",
    })
    const raw = (status as { isOpen?: unknown })?.isOpen
    const isOpen = typeof raw === "boolean" ? raw : true
    await redisTry("set market-status", (redis) =>
      redis.set<MarketStatusEntry>(
        MARKET_STATUS_KEY,
        { isOpen, fetchedAt: Date.now() },
        { ex: MARKET_STATUS_MAX_AGE_S },
      ),
    )
    return isOpen
  } catch (err) {
    console.error("[getMarketIsOpenCached] failed", err)
    return cached?.isOpen ?? true
  }
}

const inflightProfiles = new Map<string, Promise<FinnhubProfile | null>>()

/** Company profile (name/sector). Long TTL — these barely ever change. */
export async function getCachedProfile(
  symbol: string,
): Promise<FinnhubProfile | null> {
  const existing = inflightProfiles.get(symbol)
  if (existing) return existing

  const task = loadProfile(symbol).finally(() =>
    inflightProfiles.delete(symbol),
  )
  inflightProfiles.set(symbol, task)
  return task
}

async function loadProfile(symbol: string): Promise<FinnhubProfile | null> {
  const cached = await redisTry(`get profile ${symbol}`, (redis) =>
    redis.get<ProfileEntry>(profileKey(symbol)),
  )
  if (cached && Date.now() - cached.fetchedAt < PROFILE_TTL_MS) {
    return cached.profile
  }

  try {
    const profile: FinnhubProfile = await finnhubFetch("/stock/profile2", {
      symbol,
    })
    await redisTry(`set profile ${symbol}`, (redis) =>
      redis.set<ProfileEntry>(
        profileKey(symbol),
        { profile, fetchedAt: Date.now() },
        { ex: PROFILE_MAX_AGE_S },
      ),
    )
    return profile
  } catch (err) {
    console.error(`[getCachedProfile] ${symbol} failed`, err)
    return cached?.profile ?? null
  }
}

const inflightQuotes = new Map<string, Promise<FinnhubQuote | null>>()

/**
 * Live quote with market-aware refresh:
 * - market open  → serve cache for QUOTE_TTL_MS, then refetch (1/min).
 * - market closed → serve cache only if the snapshot was also taken while
 *   closed and is younger than CLOSED_QUOTE_TTL_MS. A snapshot taken while
 *   open (the open→close transition), one that predates a later close, or no
 *   snapshot at all triggers exactly one refetch to capture the official
 *   close; closed reads are then served from cache until it ages out.
 */
export async function getCachedQuote(
  symbol: string,
  marketOpen: boolean,
): Promise<FinnhubQuote | null> {
  // Keyed on marketOpen as well as the symbol, because the promise can settle
  // from cache under whichever rule its originator was applying. Two callers
  // that disagree about the market — which happens for up to
  // MARKET_STATUS_TTL_MS around the opening bell — must not share a load, or
  // the one that thinks the market is open inherits a pre-market snapshot the
  // closed-market rule waved through.
  const flightKey = `${symbol}:${marketOpen}`
  const existing = inflightQuotes.get(flightKey)
  if (existing) return existing

  const task = loadQuote(symbol, marketOpen).finally(() =>
    inflightQuotes.delete(flightKey),
  )
  inflightQuotes.set(flightKey, task)
  return task
}

async function loadQuote(
  symbol: string,
  marketOpen: boolean,
): Promise<FinnhubQuote | null> {
  const cached = await redisTry(`get quote ${symbol}`, (redis) =>
    redis.get<QuoteEntry>(quoteKey(symbol)),
  )
  if (cached) {
    if (marketOpen) {
      if (Date.now() - cached.fetchedAt < QUOTE_TTL_MS) return cached.quote
    } else if (
      !cached.marketWasOpen &&
      Date.now() - cached.fetchedAt < CLOSED_QUOTE_TTL_MS
    ) {
      return cached.quote
    }
  }

  try {
    const quote: FinnhubQuote = await finnhubFetch("/quote", { symbol })
    await redisTry(`set quote ${symbol}`, (redis) =>
      redis.set<QuoteEntry>(
        quoteKey(symbol),
        { quote, marketWasOpen: marketOpen, fetchedAt: Date.now() },
        { ex: quote?.c ? QUOTE_MAX_AGE_S : EMPTY_QUOTE_MAX_AGE_S },
      ),
    )
    return quote
  } catch (err) {
    console.error(`[getCachedQuote] ${symbol} failed`, err)
    return cached?.quote ?? null
  }
}
