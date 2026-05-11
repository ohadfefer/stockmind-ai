import { Converter } from "easy-currencies"
import type { KeyStatsData } from "@/components/details/key-stats"
import { finnhubFetch } from "@/lib/finnhub"

const converter = new Converter()

export interface FinnhubQuote {
  c: number  // current price
  d: number  // change
  dp: number // percent change
  h: number  // high
  l: number  // low
  o: number  // open
  pc: number // previous close
}

export interface FinnhubProfile {
  country?: string
  currency?: string
  exchange?: string
  finnhubIndustry?: string
  logo?: string
  marketCapitalization?: number
  name?: string
  ticker?: string
  weburl?: string
  shareOutstanding?: number
}

export interface FinnhubMetric {
  "52WeekHigh"?: number
  "52WeekLow"?: number
  "10DayAverageTradingVolume"?: number
  "3MonthAverageTradingVolume"?: number
  beta?: number
  peTTM?: number
  peBasicExclExtraTTM?: number
  epsTTM?: number
  epsBasicExclExtraItemsTTM?: number
  currentDividendYieldTTM?: number
  dividendYieldIndicatedAnnual?: number
  dividendPerShareAnnual?: number
  dividendPerShareTTM?: number
}

interface FinnhubBasicFinancials {
  metric?: FinnhubMetric
}

export interface StockQuote {
  name: string
  price: number
  changeDollar: number
  changePercent: number
  previousClose: number
  dayHigh: number
  dayLow: number
  exchange: string
  currency: string
  logo: string | undefined
}

export function formatLargeNumber(millions: number | undefined | null): string | null {
  if (millions == null || millions === 0) return null
  if (millions >= 1_000_000) return `${(millions / 1_000_000).toFixed(2)}T`
  if (millions >= 1_000) return `${(millions / 1_000).toFixed(2)}B`
  return `${millions.toFixed(2)}M`
}

// Keep the legacy export name available for other callers.
export const formatMarketCap = formatLargeNumber

function firstNumber(...values: Array<number | undefined>): number | null {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v) && v !== 0) return v
  }
  return null
}

function exchangeShortFrom(profile: FinnhubProfile | undefined): string | null {
  return profile?.exchange?.split(/\s+/)[0] ?? null
}

async function fetchQuoteAndProfile(symbol: string) {
  const [quote, profile] = await Promise.all([
    finnhubFetch("/quote", { symbol }) as Promise<FinnhubQuote>,
    finnhubFetch("/stock/profile2", { symbol }) as Promise<FinnhubProfile>,
  ])
  return { quote, profile }
}

function toStockQuote(
  symbol: string,
  quote: FinnhubQuote,
  profile: FinnhubProfile,
): StockQuote {
  const hasQuote = quote && quote.c !== 0
  const hasProfile = profile && profile.name
  return {
    name: hasProfile ? profile.name! : symbol.toUpperCase(),
    price: hasQuote ? quote.c : 0,
    changeDollar: hasQuote ? quote.d : 0,
    changePercent: hasQuote ? quote.dp : 0,
    previousClose: hasQuote ? quote.pc : 0,
    dayHigh: hasQuote ? quote.h : 0,
    dayLow: hasQuote ? quote.l : 0,
    exchange: exchangeShortFrom(profile) ?? "-",
    currency: hasProfile ? profile.currency ?? "USD" : "USD",
    logo: hasProfile ? profile.logo : undefined,
  }
}

function emptyStockQuote(symbol: string): StockQuote {
  return {
    name: symbol.toUpperCase(),
    price: 0,
    changeDollar: 0,
    changePercent: 0,
    previousClose: 0,
    dayHigh: 0,
    dayLow: 0,
    exchange: "-",
    currency: "USD",
    logo: undefined,
  }
}

const emptyKeyStats: KeyStatsData = {
  open: null,
  high: null,
  low: null,
  marketCap: null,
  avgVolume: null,
  dividendYield: null,
  quarterlyDividend: null,
  peRatio: null,
  weekHigh52: null,
  weekLow52: null,
  eps: null,
  beta: null,
  sharesOutstanding: null,
}

// Lightweight: only /quote + /stock/profile2. Use for list/dashboard views that
// don't need company key-stats — saves the heavy /stock/metric call per symbol.
export async function getStockQuote(symbol: string): Promise<StockQuote> {
  try {
    const { quote, profile } = await fetchQuoteAndProfile(symbol)
    return toStockQuote(symbol, quote, profile)
  } catch {
    return emptyStockQuote(symbol)
  }
}

export async function getStockData(symbol: string) {
  try {
    const [{ quote, profile }, financials] = await Promise.all([
      fetchQuoteAndProfile(symbol),
      finnhubFetch("/stock/metric", { symbol, metric: "all" }) as Promise<FinnhubBasicFinancials>,
    ])

    const base = toStockQuote(symbol, quote, profile)
    const hasProfile = profile && profile.name
    const hasQuote = quote && quote.c !== 0
    const metric = financials?.metric ?? {}

    const mcRaw = hasProfile ? profile.marketCapitalization : undefined
    let mcUsd = mcRaw
    if (mcRaw && base.currency !== "USD") {
      try {
        mcUsd = await converter.convert(mcRaw, base.currency, "USD")
      } catch {
        mcUsd = mcRaw
      }
    }
    const mcFormatted = formatLargeNumber(mcUsd)

    const tags: string[] = ["Stock"]
    const exShort = exchangeShortFrom(profile)
    if (exShort) tags.push(`${exShort} listed`)
    if (hasProfile && profile.country) tags.push(`${profile.country} headquartered`)

    const dividendYield = firstNumber(
      metric.currentDividendYieldTTM,
      metric.dividendYieldIndicatedAnnual,
    )
    const annualDividend = firstNumber(
      metric.dividendPerShareTTM,
      metric.dividendPerShareAnnual,
    )

    const keyStats: KeyStatsData = {
      open: hasQuote ? quote.o : null,
      high: hasQuote ? quote.h : null,
      low: hasQuote ? quote.l : null,
      marketCap: mcFormatted,
      avgVolume: formatLargeNumber(
        firstNumber(metric["10DayAverageTradingVolume"], metric["3MonthAverageTradingVolume"]) ?? undefined,
      ),
      dividendYield,
      quarterlyDividend: annualDividend != null ? annualDividend / 4 : null,
      peRatio: firstNumber(metric.peTTM, metric.peBasicExclExtraTTM),
      weekHigh52: firstNumber(metric["52WeekHigh"]),
      weekLow52: firstNumber(metric["52WeekLow"]),
      eps: firstNumber(metric.epsTTM, metric.epsBasicExclExtraItemsTTM),
      beta: firstNumber(metric.beta),
      sharesOutstanding: formatLargeNumber(profile?.shareOutstanding),
    }

    return {
      ...base,
      tags,
      keyStats,
      about: hasProfile
        ? `${profile.name} is a ${profile.finnhubIndustry ?? ""} company${profile.country ? ` headquartered in ${profile.country}` : ""}.${profile.weburl ? ` Website: ${profile.weburl}` : ""}`
        : `${symbol.toUpperCase()} — no profile data available.`,
    }
  } catch {
    return {
      ...emptyStockQuote(symbol),
      tags: ["Stock"],
      keyStats: emptyKeyStats,
      about: "Unable to load company data.",
    }
  }
}
