import { fmpFetch } from "@/lib/fmp"

export interface IndexQuote {
  symbol: string
  name: string
  price: number
  changePercentage: number
  change: number
}

interface FmpQuote {
  symbol: string
  name: string
  price: number
  changePercentage: number
  change: number
  volume: number
  dayLow: number
  dayHigh: number
  yearLow: number
  marketCap: number
  priceAvg50: number
  priceAvg200: number
  exchange: string
  open: number
  previousClose: number
  timestamp: number
}

const INDEX_SYMBOLS = [
  "^GSPC",
  "^DJI",
  "^IXIC",
  "^RUT",
  "^FTSE",
  "^N225",
  "^HSI",
  "^STOXX50E",
  "^VIX",
]

export async function getIndexQuotes(): Promise<IndexQuote[]> {
  try {
    const results = await Promise.all(
      INDEX_SYMBOLS.map((symbol) =>
        fmpFetch("/quote", { symbol }).then(
          (data: FmpQuote[]) => data[0] ?? null,
          () => null
        )
      )
    )

    return results
      .filter((q): q is FmpQuote => q !== null)
      .map((q) => ({
        symbol: q.symbol,
        name: q.name,
        price: q.price,
        changePercentage: q.changePercentage,
        change: q.change,
      }))
  } catch {
    return []
  }
}
