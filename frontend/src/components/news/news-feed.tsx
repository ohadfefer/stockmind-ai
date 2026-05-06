import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getCompanyNews } from "@/services/news-service"
import { NewsList, NewsListSkeleton } from "./news-list"

interface NewsFeedProps {
  symbol: string
}

export async function NewsFeed({ symbol }: NewsFeedProps) {
  const news = await getCompanyNews(symbol)

  return (
    <div className="space-y-4">
      <Link
        href={`/news/${symbol}`}
        className="group inline-flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary"
      >
        Latest News
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
      <NewsList items={news.slice(0, 5)} />
    </div>
  )
}

export function NewsFeedSkeleton() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Latest News</h3>
      <NewsListSkeleton />
    </div>
  )
}
