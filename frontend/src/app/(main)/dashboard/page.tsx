import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getAccountDetails } from "@/services/account-service"
import { getPortfolioSummary, type Holding } from "@/services/portfolio-service"
import { getDashboardWatchlistStocks } from "@/services/dashboard/dashboard-watchlist-service"
import { getEtfQuote, type EtfQuote } from "@/services/dashboard/etf-quote-service"
import {
  getPortfolioStats,
  type PortfolioStats,
} from "@/services/position/portfolio-daily-value-service"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { HoldingsHeatmap } from "@/components/dashboard/holdings-heatmap"
import { NewsFeed } from "@/components/dashboard/news-feed"

const BENCHMARK_ETFS = ["SPY", "QQQ", "IWM"] as const

export default async function DashboardPage() {
  const watchlistPromise = getDashboardWatchlistStocks()
  const etfsPromise = Promise.all(BENCHMARK_ETFS.map((t) => getEtfQuote(t)))

  let holdings: Holding[] = []
  let portfolioReturnPercent = 0
  let stats: PortfolioStats | null = null
  const session = await auth0.getSession()
  if (session) {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (userId) {
      const account = await getAccountDetails(userId)
      if (account) {
        const [summary, statsResult] = await Promise.all([
          getPortfolioSummary(account.id, account.running_balance),
          getPortfolioStats(account.id),
        ])
        holdings = summary.holdings
        portfolioReturnPercent = summary.todayPLPercent
        stats = statsResult
      }
    }
  }

  const [watchlistStocks, etfQuotes] = await Promise.all([watchlistPromise, etfsPromise])
  const etfs = etfQuotes.filter((e): e is EtfQuote => e !== null)

  return (
    <div className="flex flex-col gap-6">
      <KPICards
        portfolioReturnPercent={portfolioReturnPercent}
        etfs={etfs}
        holdings={holdings}
        stats={stats}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HoldingsHeatmap holdings={holdings} watchlist={watchlistStocks} />
        <NewsFeed />
      </div>
    </div>
  )
}
