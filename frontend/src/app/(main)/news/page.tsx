import { getMarketNews } from "@/services/news-service"
import { NewsCategoryTabs } from "@/components/news/news-category-tabs"
import { MarketNewsFeed } from "@/components/news/market-news-feed"

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category = "general" } = await searchParams
  const initialNews = await getMarketNews(category)

  return (
    <>
      <NewsCategoryTabs activeCategory={category} />
      <MarketNewsFeed key={category} initialNews={initialNews} />
    </>
  )
}
