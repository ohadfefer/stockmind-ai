"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NewsList } from "./news-list"
import type { FinnhubNewsItem } from "@/services/news-service"

const PAGE_SIZE = 7

interface MarketNewsFeedProps {
  initialNews: FinnhubNewsItem[]
}

export function MarketNewsFeed({ initialNews }: MarketNewsFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visible = initialNews.slice(0, visibleCount)
  const hasMore = initialNews.length > visibleCount

  const loadMore = () => setVisibleCount((c) => c + PAGE_SIZE)

  return (
    <div className="space-y-4">
      <NewsList items={visible} />
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
