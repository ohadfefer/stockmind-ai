import { MarketOverviewBar } from "@/components/dashboard/market-overview-bar"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { WatchlistQuickView } from "@/components/dashboard/watchlist-quick-view"
import { AIAdvisorFeed } from "@/components/dashboard/ai-advisor-feed"
import { SectorHeatmap } from "@/components/dashboard/sector-heatmap"
import { NewsFeed } from "@/components/dashboard/news-feed"
import { getSectorPerformance } from "@/services/dashboard/sector-service"
import { getIndexQuotes } from "@/services/dashboard/index-service"
import { getDashboardWatchlistStocks } from "@/services/dashboard/dashboard-watchlist-service"

export default async function DashboardPage() {
  const [sectorData, indexQuotes, watchlistStocks] = await Promise.all([
    getSectorPerformance("1D"),
    getIndexQuotes(),
    getDashboardWatchlistStocks(8),
  ])

  return (
    <div className="flex flex-col gap-6">
      {/* Market Overview Ticker Strip */}
      <MarketOverviewBar data={indexQuotes} />

      {/* KPI Cards */}
      <KPICards />

      {/* Watchlist + AI Advisor Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <WatchlistQuickView stocks={watchlistStocks} />
        <AIAdvisorFeed />
      </div>

      {/* Sector Heatmap + News */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <SectorHeatmap initialData={sectorData} />
        <NewsFeed />
      </div>
    </div>
  )
}
