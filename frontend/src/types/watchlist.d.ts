export type WatchlistInfo = {
  id: number
  name: string
  stockCount: number
}

export type WatchlistWithStatus = {
  id: number
  name: string
  hasSymbol: boolean
}

export interface WatchlistStockData {
  ticker: string
  company: string
  price: number
  changeDollar: number
  changePercent: number
  marketCap: string | null
  open: number | null
  dayLow: number | null
  dayHigh: number | null
  aiScore: number | null
}
