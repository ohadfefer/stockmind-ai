import { finnhubFetch } from "@/lib/finnhub"
import { getPositions } from "@/services/position-service"
import type { FinnhubQuote } from "@/services/stock-service"

export interface PortfolioSummary {
  runningBalance: number
  totalValue: number
  totalPL: number
  totalPLPercent: number
  todayPL: number
  todayPLPercent: number
}

export async function getPortfolioSummary(
  accountId: number,
  runningBalance: number,
): Promise<PortfolioSummary> {
  const positions = await getPositions(accountId)

  if (positions.length === 0) {
    return { runningBalance, totalValue: 0, totalPL: 0, totalPLPercent: 0, todayPL: 0, todayPLPercent: 0 }
  }

  // Fetch quotes for all held symbols in parallel
  const quotes = await Promise.all(
    positions.map((p) =>
      finnhubFetch("/quote", { symbol: p.symbol })
        .then((q: FinnhubQuote) => ({ symbol: p.symbol, quote: q }))
        .catch(() => ({ symbol: p.symbol, quote: null }))
    ),
  )
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q.quote]))

  let totalValue = 0
  let totalCostBasis = 0
  let todayPL = 0

  for (const pos of positions) {
    const quote = quoteMap.get(pos.symbol)
    if (!quote || !quote.c) continue

    const marketValue = pos.quantity * quote.c
    const costBasis = pos.quantity * pos.average_cost_basis

    totalValue += marketValue
    totalCostBasis += costBasis
    todayPL += pos.quantity * (quote.c - quote.pc)
  }

  const totalPL = totalValue - totalCostBasis
  const totalPLPercent = totalCostBasis > 0 ? (totalPL / totalCostBasis) * 100 : 0
  const todayPLPercent = totalValue - todayPL > 0 ? (todayPL / (totalValue - todayPL)) * 100 : 0

  return { runningBalance, totalValue, totalPL, totalPLPercent, todayPL, todayPLPercent }
}
