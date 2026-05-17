import { finnhubFetch } from "@/lib/finnhub"

export interface FinnhubNewsItem {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

// News changes slowly relative to quotes; refresh at most twice a day to keep
// Finnhub request volume low. Backed by Next's data cache (per-URL), so each
// category / symbol caches independently.
const TWELVE_HOURS_SECONDS = 12 * 60 * 60

const DATE_STRING_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function isValidDateString(s: string | undefined): s is string {
  return !!s && DATE_STRING_REGEX.test(s) && !Number.isNaN(Date.parse(s))
}

export function defaultCompanyNewsRange(): { from: string; to: string } {
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  return { from: toLocalDateString(twoDaysAgo), to: toLocalDateString(now) }
}

export async function getMarketNews(
  category = "general"
): Promise<FinnhubNewsItem[]> {
  try {
    const data = await finnhubFetch(
      "/news",
      { category },
      {
        revalidate: TWELVE_HOURS_SECONDS,
        tags: ["market-news", `market-news:${category}`],
      },
    )
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error("getMarketNews failed", err)
    return []
  }
}

export async function getCompanyNews(
  symbol: string,
  from?: string,
  to?: string
): Promise<FinnhubNewsItem[]> {
  const range = defaultCompanyNewsRange()
  const fromDate = from ?? range.from
  const toDate = to ?? range.to

  try {
    const data = await finnhubFetch(
      "/company-news",
      { symbol, from: fromDate, to: toDate },
      {
        revalidate: TWELVE_HOURS_SECONDS,
        tags: ["company-news", `company-news:${symbol}`],
      },
    )
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error("getCompanyNews failed", err)
    return []
  }
}
