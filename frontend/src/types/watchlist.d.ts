export type WatchlistInfo = {
  id: number
  name: string
  itemCount: number
  /**
   * Only present when the collection was queried with ?symbol=. The picker
   * needs every list plus a per-list flag to render unchecked boxes, so the
   * symbol annotates the results rather than filtering them.
   */
  containsSymbol?: boolean
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
