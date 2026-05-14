import {
  defaultCompanyNewsRange,
  getCompanyNews,
  isValidDateString,
} from "@/services/news-service"
import { CompanyNewsDateFilter } from "@/components/news/company-news-date-filter"
import { NewsList } from "@/components/news/news-list"
import { NewsPagination } from "@/components/news/news-pagination"
import {
  buildPageHref,
  NEWS_PAGE_SIZE,
  paginate,
  parsePage,
} from "@/lib/pagination"

export default async function SymbolNewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ symbol: string }>
  searchParams: Promise<{ from?: string; to?: string; page?: string }>
}) {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()
  const { from, to, page: pageParam } = await searchParams

  const range = defaultCompanyNewsRange()
  const fromStr = isValidDateString(from) ? from : range.from
  const toStr = isValidDateString(to) ? to : range.to

  const allNews = await getCompanyNews(upperSymbol, fromStr, toStr)
  const { items, page, totalPages } = paginate(
    allNews,
    parsePage(pageParam),
    NEWS_PAGE_SIZE,
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <CompanyNewsDateFilter symbol={upperSymbol} from={fromStr} to={toStr} />
      </div>
      <div className="min-h-[600px]">
        <NewsList items={items} />
      </div>
      <NewsPagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) =>
          buildPageHref(`/news/${upperSymbol}`, { from: fromStr, to: toStr }, p)
        }
      />
    </div>
  )
}
