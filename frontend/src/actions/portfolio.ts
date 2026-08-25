import { apiFetch } from "@/actions/http"
import type { PortfolioSummary } from "@/services/portfolio/portfolio-service"

/**
 * Polled every 60s while the market is open, so redirectOnAuthFailure is off:
 * an interval that navigates on expiry yanks the page away from whatever the
 * user is doing. The caller swallows a failed tick — the previous numbers stay
 * on screen and the next tick corrects them.
 */
export async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  return apiFetch<PortfolioSummary>("/api/portfolio/summary", {
    redirectOnAuthFailure: false,
  })
}

export interface TradingInfo {
  cashBalance: number
  positions: { symbol: string; quantity: number }[]
}

export async function fetchTradingInfo(): Promise<TradingInfo> {
  return apiFetch<TradingInfo>("/api/portfolio/trading-info")
}
