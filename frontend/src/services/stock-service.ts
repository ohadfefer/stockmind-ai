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
}

export function formatMarketCap(millions: number | undefined): string | null {
  if (!millions) return null
  if (millions >= 1_000_000) return `${(millions / 1_000_000).toFixed(2)}T`
  if (millions >= 1_000) return `${(millions / 1_000).toFixed(2)}B`
  return `${millions.toFixed(2)}M`
}

export async function getStockData(symbol: string, { skipMarketCap = false } = {}) {
  try {
    const [quote, profile] = await Promise.all([
      finnhubFetch("/quote", { symbol }) as Promise<FinnhubQuote>,
      finnhubFetch("/stock/profile2", { symbol }) as Promise<FinnhubProfile>,
    ])

    const hasQuote = quote && quote.c !== 0
    const hasProfile = profile && profile.name
    const exchangeShort = profile?.exchange?.split(/\s+/)[0] ?? null

    const tags: string[] = ["Stock"]
    if (exchangeShort) tags.push(`${exchangeShort} listed`)
    if (hasProfile && profile.country) tags.push(`${profile.country} headquartered`)

    const currency = hasProfile ? profile.currency ?? "USD" : "USD"
    let mcFormatted: string | null = null
    if (!skipMarketCap) {
      const mcRaw = hasProfile ? profile.marketCapitalization : undefined
      let mcUsd = mcRaw
      if (mcRaw && currency !== "USD") {
        try {
          mcUsd = await converter.convert(mcRaw, currency, "USD")
        } catch {
          mcUsd = mcRaw
        }
      }
      mcFormatted = formatMarketCap(mcUsd)
    }

    const keyStats: KeyStatsData = {
      previousClose: hasQuote ? quote.pc : null,
      dayRange: hasQuote ? [quote.l, quote.h] : [null, null],
      yearRange: [null, null],
      marketCap: mcFormatted ? `$${mcFormatted}` : null,
      avgVolume: null,
      peRatio: null,
      dividendYield: null,
      primaryExchange: exchangeShort,
    }

    return {
      name: hasProfile ? profile.name! : symbol.toUpperCase(),
      price: hasQuote ? quote.c : 0,
      changeDollar: hasQuote ? quote.d : 0,
      changePercent: hasQuote ? quote.dp : 0,
      previousClose: hasQuote ? quote.pc : 0,
      dayHigh: hasQuote ? quote.h : 0,
      dayLow: hasQuote ? quote.l : 0,
      exchange: exchangeShort ?? "-",
      currency,
      tags,
      keyStats,
      about: hasProfile
        ? `${profile.name} is a ${profile.finnhubIndustry ?? ""} company${profile.country ? ` headquartered in ${profile.country}` : ""}.${profile.weburl ? ` Website: ${profile.weburl}` : ""}`
        : `${symbol.toUpperCase()} — no profile data available.`,
      logo: hasProfile ? profile.logo : undefined,
    }
  } catch {
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
      tags: ["Stock"],
      keyStats: {
        previousClose: null,
        dayRange: [null, null] as [null, null],
        yearRange: [null, null] as [null, null],
        marketCap: null,
        avgVolume: null,
        peRatio: null,
        dividendYield: null,
        primaryExchange: null,
      },
      about: "Unable to load company data.",
      logo: undefined,
    }
  }
}
