import { Clock } from "lucide-react"
import { WatchlistTab } from "@/components/portfolio/watchlist-tab"
import type { WatchlistStockData } from "@/components/portfolio/watchlist-tab"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getWatchlistSymbols } from "@/services/watchlist-service"
import { getStockData } from "@/services/stock-service"
import { finnhubFetch } from "@/lib/finnhub"

// Cache market data per symbol (not the symbol list) so unfollows are reflected immediately
const priceCache = new Map<string, { data: WatchlistStockData; marketWasOpen: boolean }>()

export default async function WatchlistPage() {
  const session = await auth0.getSession()
  const auth0Id = session?.user?.sub

  let stocks: WatchlistStockData[] = []

  if (auth0Id) {
    const userId = await getUserIdByAuth0Id(auth0Id)
    if (userId) {
      const symbols = await getWatchlistSymbols(userId)
      const status = await finnhubFetch("/stock/market-status", { exchange: "US" }) as { isOpen: boolean }
      const marketIsOpen = status.isOpen

      stocks = await Promise.all(
        symbols.map(async (symbol) => {
          const cached = priceCache.get(symbol)
          if (cached && !marketIsOpen && !cached.marketWasOpen) {
            return cached.data
          }

          const data = await getStockData(symbol)
          const entry: WatchlistStockData = {
            ticker: symbol,
            company: data.name,
            price: data.price,
            changeDollar: data.changeDollar,
            changePercent: data.changePercent,
            marketCap: data.keyStats.marketCap,
            dayLow: data.dayLow || null,
            dayHigh: data.dayHigh || null,
            aiScore: null,
          }
          priceCache.set(symbol, { data: entry, marketWasOpen: marketIsOpen })
          return entry
        })
      )
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
