"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Newspaper } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface FinnhubNewsItem {
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

function formatDatetime(unix: number): string {
  const date = new Date(unix * 1000)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "1 day ago"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function truncateSummary(summary: string, maxLength = 180): string {
  if (!summary) return ""
  if (summary.length <= maxLength) return summary
  return summary.slice(0, maxLength).trimEnd() + "..."
}

interface NewsFeedProps {
  symbol: string
}

export function NewsFeed({ symbol }: NewsFeedProps) {
  const [news, setNews] = useState<FinnhubNewsItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(`/api/company/news?symbol=${encodeURIComponent(symbol)}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const data: FinnhubNewsItem[] = await res.json()
        setNews(data.slice(0, 5))
      } catch {
        setNews([])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [symbol])

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">In the news</h3>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-lg p-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="size-20 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">In the news</h3>
        <p className="text-sm text-muted-foreground">No recent news found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/news/${symbol}`}
        className="group inline-flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary"
      >
        Latest News
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>

      <div className="space-y-2">
        {news.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex cursor-pointer items-start gap-4 rounded-lg p-5 transition-colors hover:bg-muted/50"
          >
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{item.source}</span>
                <span>·</span>
                <span>{formatDatetime(item.datetime)}</span>
              </div>
              <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
                {item.headline}
              </p>
              {item.summary && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {truncateSummary(item.summary)}
                </p>
              )}
            </div>
            {item.image ? (
              <img
                src={item.image}
                alt=""
                className="size-20 shrink-0 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Newspaper className="size-6 text-muted-foreground" />
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
