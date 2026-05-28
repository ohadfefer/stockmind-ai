import { getPositions } from "@/services/position/position-service"
import {
  getCachedQuote,
  getCachedProfile,
  getMarketIsOpenCached,
} from "@/services/stock/quote-cache"

export interface Holding {
  ticker: string
  company: string
  sector: string
  logo?: string
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
  // US market open/closed at fetch time. Drives the client's poll cadence:
  // poll every minute while open, stop (refetch on refocus) while closed.
  marketOpen?: boolean
}

export async function getPortfolioSummary(
  accountId: number,
  runningBalance: number,
): Promise<PortfolioSummary> {
  const [positions, marketOpen] = await Promise.all([
    getPositions(accountId),
    getMarketIsOpenCached(),
  ])

  if (positions.length === 0) {
    return { runningBalance, portfolioValue: 0, totalPL: 0, totalPLPercent: 0, todayPL: 0, todayPLPercent: 0, holdings: [], marketOpen }
  }

  // Cached + market-aware: quotes refetch at most 1/min while open and freeze
  // to the captured close while shut; profiles are long-lived.
  const [quotes, profiles] = await Promise.all([
    Promise.all(
      positions.map((p) =>
        getCachedQuote(p.symbol, marketOpen).then((quote) => ({
          symbol: p.symbol,
          quote,
        })),
      ),
    ),
    Promise.all(
      positions.map((p) =>
        getCachedProfile(p.symbol).then((profile) => ({
          symbol: p.symbol,
          profile,
        })),
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
      logo: profile?.logo,
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

  return { runningBalance, portfolioValue, totalPL, totalPLPercent, todayPL, todayPLPercent, holdings, marketOpen }
}
