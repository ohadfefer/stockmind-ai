import type { PortfolioSummary } from "@/services/portfolio/portfolio-service"

export async function fetchPortfolioSummary(): Promise<PortfolioSummary | null> {
  const res = await fetch("/api/portfolio/summary")
  if (!res.ok) return null
  return res.json()
}

export interface TradingInfo {
  cashBalance: number
  positions: { symbol: string; quantity: number }[]
}

export async function fetchTradingInfo(): Promise<TradingInfo | null> {
  const res = await fetch("/api/portfolio/trading-info")
  if (!res.ok) return null
  return res.json()
}
