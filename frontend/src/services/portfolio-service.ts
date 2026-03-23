import { finnhubFetch } from "@/lib/finnhub"
import { getPositions } from "@/services/position-service"
import type { FinnhubQuote, FinnhubProfile } from "@/services/stock-service"

export interface Holding {
  ticker: string
  company: string
  sector: string
  shares: number
  avgBuy: number
  currentPrice: number
  totalValue: number
  plDollar: number
  plPercent: number
  dayChangeDollar: number
  dayChangePercent: number
  portfolioWeight: number
}

export interface PortfolioSummary {
  runningBalance: number
  portfolioValue: number
  totalPL: number
  totalPLPercent: number
  todayPL: number
  todayPLPercent: number
  holdings: Holding[]
}

export async function getPortfolioSummary(
  accountId: number,
  runningBalance: number,
): Promise<PortfolioSummary> {
  const positions = await getPositions(accountId)

  if (positions.length === 0) {
    return { runningBalance, portfolioValue: 0, totalPL: 0, totalPLPercent: 0, todayPL: 0, todayPLPercent: 0, holdings: [] }
  }

  // Fetch quotes and profiles for all held symbols in parallel
  const [quotes, profiles] = await Promise.all([
    Promise.all(
      positions.map((p) =>
        finnhubFetch("/quote", { symbol: p.symbol })
          .then((q: FinnhubQuote) => ({ symbol: p.symbol, quote: q }))
          .catch(() => ({ symbol: p.symbol, quote: null }))
      ),
    ),
    Promise.all(
      positions.map((p) =>
        finnhubFetch("/stock/profile2", { symbol: p.symbol })
          .then((prof: FinnhubProfile) => ({ symbol: p.symbol, profile: prof }))
          .catch(() => ({ symbol: p.symbol, profile: null }))
      ),
    ),
  ])

  const quoteMap = new Map(quotes.map((q) => [q.symbol, q.quote]))
  const profileMap = new Map(profiles.map((p) => [p.symbol, p.profile]))

  let portfolioValue = 0
  let totalCostBasis = 0
  let todayPL = 0
  const holdingsRaw: Omit<Holding, "portfolioWeight">[] = []

  for (const pos of positions) {
    const quote = quoteMap.get(pos.symbol)
    if (!quote || !quote.c) continue

    const profile = profileMap.get(pos.symbol)
    const marketValue = pos.quantity * quote.c
    const costBasis = pos.quantity * pos.average_cost_basis
    const pl = marketValue - costBasis
    const plPercent = costBasis > 0 ? (pl / costBasis) * 100 : 0
    const dayChange = pos.quantity * (quote.c - quote.pc)
    const dayChangePercent = quote.pc > 0 ? ((quote.c - quote.pc) / quote.pc) * 100 : 0

    portfolioValue += marketValue
    totalCostBasis += costBasis
    todayPL += dayChange

    holdingsRaw.push({
      ticker: pos.symbol,
      company: profile?.name ?? pos.symbol,
      sector: profile?.finnhubIndustry ?? "—",
      shares: pos.quantity,
      avgBuy: pos.average_cost_basis,
      currentPrice: quote.c,
      totalValue: marketValue,
      plDollar: pl,
      plPercent,
      dayChangeDollar: dayChange,
      dayChangePercent,
    })
  }

  const holdings: Holding[] = holdingsRaw.map((h) => ({
    ...h,
    portfolioWeight: portfolioValue > 0 ? (h.totalValue / portfolioValue) * 100 : 0,
  }))

  const totalPL = portfolioValue - totalCostBasis
  const totalPLPercent = totalCostBasis > 0 ? (totalPL / totalCostBasis) * 100 : 0
  const todayPLPercent = portfolioValue - todayPL > 0 ? (todayPL / (portfolioValue - todayPL)) * 100 : 0

  return { runningBalance, portfolioValue, totalPL, totalPLPercent, todayPL, todayPLPercent, holdings }
}
