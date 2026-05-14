import { getMarketNews } from "@/services/news-service"
import { NewsCategoryTabs } from "@/components/news/news-category-tabs"
import { NewsList } from "@/components/news/news-list"
import { NewsPagination } from "@/components/news/news-pagination"
import {
  buildPageHref,
  NEWS_PAGE_SIZE,
  paginate,
  parsePage,
} from "@/lib/pagination"

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { category = "general", page: pageParam } = await searchParams
  const allNews = await getMarketNews(category)
  const { items, page, totalPages } = paginate(
    allNews,
    parsePage(pageParam),
    NEWS_PAGE_SIZE,
  )

  return (
    <>
      <NewsCategoryTabs activeCategory={category} />
      <div className="flex flex-col gap-4">
        <div className="min-h-[600px]">
          <NewsList items={items} />
        </div>
        <NewsPagination
          page={page}
          totalPages={totalPages}
          buildHref={(p) => buildPageHref("/news", { category }, p)}
        />
      </div>
    </>
  )
}
