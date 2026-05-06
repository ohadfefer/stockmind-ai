"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DateRangePicker } from "@/components/date-range-picker"
import { NewsList } from "./news-list"
import {
  parseLocalDate,
  toLocalDateString,
  type FinnhubNewsItem,
} from "@/services/news-service"

const PAGE_SIZE = 7

interface CompanyNewsFeedProps {
  symbol: string
  initialNews: FinnhubNewsItem[]
  from: string
  to: string
}

export function CompanyNewsFeed({ symbol, initialNews, from, to }: CompanyNewsFeedProps) {
  const router = useRouter()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const visible = initialNews.slice(0, visibleCount)
  const hasMore = initialNews.length > visibleCount

  const loadMore = () => setVisibleCount((c) => c + PAGE_SIZE)

  const handleRangeChange = (newFrom: Date, newTo: Date) => {
    const params = new URLSearchParams({
      from: toLocalDateString(newFrom),
      to: toLocalDateString(newTo),
    })
    router.push(`/news/${symbol}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <DateRangePicker
          from={parseLocalDate(from)}
          to={parseLocalDate(to)}
          onRangeChange={handleRangeChange}
        />
      </div>
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
