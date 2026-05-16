import { loadPortfolioPageData } from "@/services/portfolio/portfolio-page-data"
import { PortfolioTabsBar } from "@/components/portfolio/portfolio-tabs-bar"
import { PortfolioTabContent } from "@/components/portfolio/portfolio-tab-content"

export default function PortfolioPage() {
  const { summaryPromise, alertsPromise, reviewPromise } =
    loadPortfolioPageData()

  return (
    <div className="flex flex-col gap-6">
      <PortfolioTabsBar />
      <PortfolioTabContent
        summaryPromise={summaryPromise}
        alertsPromise={alertsPromise}
        reviewPromise={reviewPromise}
      />
    </div>
  )
}
