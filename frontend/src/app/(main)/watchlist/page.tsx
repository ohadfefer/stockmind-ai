import { Clock } from "lucide-react"
import { WatchlistTab } from "@/components/portfolio/watchlist-tab"
import type { WatchlistStockData } from "@/components/portfolio/watchlist-tab"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id, getWatchlistSymbols } from "@/services/watchlist-service"
import { getStockData } from "@/services/stock-service"
import { finnhubFetch } from "@/lib/finnhub"

const stocksCache = new Map<number, { stocks: WatchlistStockData[]; marketWasOpen: boolean }>()

export default async function WatchlistPage() {
  const session = await auth0.getSession()
  const auth0Id = session?.user?.sub

  let stocks: WatchlistStockData[] = []

  if (auth0Id) {
    const userId = await getUserIdByAuth0Id(auth0Id)
    if (userId) {
      const cached = stocksCache.get(userId)
      const status = await finnhubFetch("/stock/market-status", { exchange: "US" }) as { isOpen: boolean }
      const marketIsOpen = status.isOpen

      // Use cache only if market is closed AND data was captured after close
      if (cached && !marketIsOpen && !cached.marketWasOpen) {
        stocks = cached.stocks
        return renderPage(stocks)
      }

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
      }))

      stocksCache.set(userId, { stocks, marketWasOpen: marketIsOpen })
    }
  }

  return renderPage(stocks)
}

function renderPage(stocks: WatchlistStockData[]) {
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
