import {
  defaultCompanyNewsRange,
  getCompanyNews,
  isValidDateString,
} from "@/services/news-service"
import { CompanyNewsFeed } from "@/components/news/company-news-feed"

export default async function SymbolNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()
  const { from, to } = await searchParams

  const range = defaultCompanyNewsRange()
  const fromStr = isValidDateString(from) ? from : range.from
  const toStr = isValidDateString(to) ? to : range.to

  const initialNews = await getCompanyNews(upperSymbol, fromStr, toStr)

  return (
    <CompanyNewsFeed
      key={`${fromStr}-${toStr}`}
      symbol={upperSymbol}
      initialNews={initialNews}
      from={fromStr}
      to={toStr}
    />
  )
}
