import { resolveAccountContext } from "@/services/account-context"
import {
  getPortfolioSummary,
  type PortfolioSummary,
  type Holding,
} from "@/services/portfolio/portfolio-service"
import { getDashboardWatchlistStocks } from "@/services/dashboard/dashboard-watchlist-service"
import { getEtfQuote, type EtfQuote } from "@/services/dashboard/etf-quote-service"
import {
  getPortfolioStats,
  type PortfolioStats,
} from "@/services/position/portfolio-daily-value-service"
import { getMarketNews, type FinnhubNewsItem } from "@/services/news-service"
import {
  getMarketSentiment,
  type MarketSentiment,
} from "@/services/dashboard/market-sentiment-service"
import { getIndexQuotes, type IndexQuote } from "@/services/dashboard/index-service"
import type { WatchlistStockData } from "@/types/watchlist"

const BENCHMARK_ETFS = ["SPY", "QQQ", "IWM"] as const

const DEFAULT_SUMMARY: PortfolioSummary = {
  runningBalance: 0,
  portfolioValue: 0,
  totalPL: 0,
  totalPLPercent: 0,
  todayPL: 0,
  todayPLPercent: 0,
  holdings: [],
}

export interface DashboardKpiData {
  portfolioReturnPercent: number
  etfs: EtfQuote[]
  holdings: Holding[]
  stats: PortfolioStats | null
}

export interface DashboardHeatmapData {
  holdings: Holding[]
  watchlist: WatchlistStockData[]
}

export interface DashboardNewsData {
  news: FinnhubNewsItem[]
  sentiment: MarketSentiment | null
}

export interface DashboardPageData {
  indexesPromise: Promise<IndexQuote[]>
  kpiPromise: Promise<DashboardKpiData>
  heatmapPromise: Promise<DashboardHeatmapData>
  newsPromise: Promise<DashboardNewsData>
}

// Logs with context (so the server retains the real error) then rethrows so
// the promise still rejects. We deliberately do NOT swallow into defaults: a
// transient DB/Finnhub failure must surface as an error state, not as a
// legitimate-looking $0 / empty portfolio. The only "empty" path is a genuine
// null context (no session/account), handled inline below.
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

/**
 * Kicks off dashboard data fetching without blocking the page render.
 * Returns one promise per visual section so each can stream in under its own
 * Suspense boundary. The auth/account chain and portfolio summary are resolved
 * once and shared between the KPI and heatmap sections.
 *
 * Market data services (indexes, ETFs, news, sentiment) already degrade to safe
 * empties internally, so they never reject. The portfolio-derived chain
 * (context, summary, stats) rejects on real failure so the KPI/heatmap error
 * boundary renders a retryable state instead of a misleading empty portfolio.
 */
export function loadDashboardPageData(): DashboardPageData {
  const ctxPromise = resolveAccountContext().catch(
    logAndRethrow("dashboard context resolve failed"),
  )

  const summaryPromise = ctxPromise.then((ctx) =>
    ctx
      ? getPortfolioSummary(ctx.accountId, ctx.runningBalance).catch(
          logAndRethrow("portfolio summary failed"),
        )
      : DEFAULT_SUMMARY,
  )

  const statsPromise = ctxPromise.then((ctx) =>
    ctx
      ? getPortfolioStats(ctx.accountId).catch(
          logAndRethrow("portfolio stats failed"),
        )
      : null,
  )

  const etfsPromise = Promise.all(
    BENCHMARK_ETFS.map((t) => getEtfQuote(t)),
  ).then((quotes) => quotes.filter((e): e is EtfQuote => e !== null))

  const watchlistPromise = getDashboardWatchlistStocks()
  const indexesPromise = getIndexQuotes()
  const marketNewsPromise = getMarketNews("general")
  const sentimentPromise = getMarketSentiment()

  const kpiPromise = Promise.all([
    summaryPromise,
    statsPromise,
    etfsPromise,
  ]).then(([summary, stats, etfs]) => ({
    portfolioReturnPercent: summary.todayPLPercent,
    holdings: summary.holdings,
    stats,
    etfs,
  }))

  const heatmapPromise = Promise.all([summaryPromise, watchlistPromise]).then(
    ([summary, watchlist]) => ({ holdings: summary.holdings, watchlist }),
  )

  const newsPromise = Promise.all([marketNewsPromise, sentimentPromise]).then(
    ([news, sentiment]) => ({ news, sentiment }),
  )

  return { indexesPromise, kpiPromise, heatmapPromise, newsPromise }
}
