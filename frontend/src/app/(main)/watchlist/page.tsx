import { Clock } from "lucide-react"
import { WatchlistTab } from "@/components/portfolio/watchlist-tab"
import type { WatchlistStockData } from "@/components/portfolio/watchlist-tab"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id, getWatchlistSymbols } from "@/services/watchlist-service"
import { getStockData } from "@/services/stock-service"

// Mock sparklines until real historical data is available
const MOCK_SPARKLINES = [
  [40, 42, 38, 44, 46, 48, 45, 50, 52, 54, 53, 56],
  [60, 58, 55, 50, 52, 48, 45, 42, 40, 38, 36, 35],
  [50, 52, 51, 53, 55, 54, 56, 58, 57, 59, 60, 62],
  [30, 35, 40, 45, 50, 55, 58, 62, 68, 72, 78, 82],
  [42, 44, 46, 45, 48, 50, 52, 55, 57, 56, 58, 60],
]

export default async function WatchlistPage() {
  const session = await auth0.getSession()
  const auth0Id = session?.user?.sub

  let stocks: WatchlistStockData[] = []

  if (auth0Id) {
    const userId = await getUserIdByAuth0Id(auth0Id)
    if (userId) {
      const symbols = await getWatchlistSymbols(userId)
      const results = await Promise.all(symbols.map((s) => getStockData(s)))

      stocks = results.map((data, i) => ({
        ticker: symbols[i],
        company: data.name,
        price: data.price,
        changeDollar: data.changeDollar,
        changePercent: data.changePercent,
        marketCap: data.keyStats.marketCap,
        dayLow: data.dayLow || null,
        dayHigh: data.dayHigh || null,
        aiScore: null,
        sparkline: MOCK_SPARKLINES[i % MOCK_SPARKLINES.length],
      }))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          Watchlist
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-3.5" />
          Live market data
        </p>
      </div>

      <WatchlistTab stocks={stocks} />
    </div>
  )
}
