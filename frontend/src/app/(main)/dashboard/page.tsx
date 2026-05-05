import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getAccountDetails } from "@/services/account-service"
import { getPortfolioSummary, type Holding } from "@/services/portfolio-service"
import { getDashboardWatchlistStocks } from "@/services/dashboard/dashboard-watchlist-service"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { HoldingsHeatmap } from "@/components/dashboard/holdings-heatmap"
import { NewsFeed } from "@/components/dashboard/news-feed"

export default async function DashboardPage() {
  const watchlistPromise = getDashboardWatchlistStocks()

  let holdings: Holding[] = []
  const session = await auth0.getSession()
  if (session) {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (userId) {
      const account = await getAccountDetails(userId)
      if (account) {
        const summary = await getPortfolioSummary(
          account.id,
          account.running_balance,
        )
        holdings = summary.holdings
      }
    }
  }

  const watchlistStocks = await watchlistPromise

  return (
    <div className="flex flex-col gap-6">
      <KPICards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HoldingsHeatmap holdings={holdings} watchlist={watchlistStocks} />
        <NewsFeed />
      </div>
    </div>
  )
}
