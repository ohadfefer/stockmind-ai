import { getStockData } from "@/services/stock/stock-service"
import {
  getMarketIsOpen,
  getOrFetchPrice,
} from "@/services/stock/stock-price-cache"

export interface EtfQuote {
  ticker: string
  price: number
  changePercent: number
}

export async function getEtfQuote(ticker: string): Promise<EtfQuote | null> {
  try {
    const marketIsOpen = await getMarketIsOpen()
    const data = await getOrFetchPrice(ticker, marketIsOpen, async () => {
      const d = await getStockData(ticker, { skipMarketCap: true })
      return {
        ticker,
        company: d.name,
        price: d.price,
        changeDollar: d.changeDollar,
        changePercent: d.changePercent,
        marketCap: null,
        dayLow: d.dayLow || null,
        dayHigh: d.dayHigh || null,
        aiScore: null,
      }
    })
    if (!data.price) return null
    return { ticker, price: data.price, changePercent: data.changePercent }
  } catch (err) {
    console.error(`[getEtfQuote] failed for ${ticker}`, err)
    return null
  }
}
