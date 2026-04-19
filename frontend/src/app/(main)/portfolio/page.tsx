import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getAccountDetails } from "@/services/account-service"
import { getPortfolioSummary, type PortfolioSummary } from "@/services/portfolio-service"
import { getAlerts, type StockAlert } from "@/services/alerts/alerts-service"
import { getPortfolioReview, type PortfolioReview } from "@/services/ai/portfolio-review-service"
import { PortfolioTabsBar } from "@/components/portfolio/portfolio-tabs-bar"
import { PortfolioTabContent } from "@/components/portfolio/portfolio-tab-content"

export default async function PortfolioPage() {
  let summary: PortfolioSummary = {
    runningBalance: 0,
    portfolioValue: 0,
    totalPL: 0,
    totalPLPercent: 0,
    todayPL: 0,
    todayPLPercent: 0,
    holdings: [],
  }
  let alerts: StockAlert[] = []
  let reviewPromise: Promise<PortfolioReview> = Promise.resolve({
    short: "",
    full: "",
    model: "",
    createdAt: new Date(),
  })

  const session = await auth0.getSession()
  if (session) {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (userId) {
      const account = await getAccountDetails(userId)
      if (account) {
        ;[summary, alerts] = await Promise.all([
          getPortfolioSummary(account.id, account.running_balance),
          getAlerts(account.id),
        ])
        reviewPromise = getPortfolioReview(account.id, summary)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PortfolioTabsBar />
      <PortfolioTabContent summary={summary} alerts={alerts} reviewPromise={reviewPromise} />
    </div>
  )
}
