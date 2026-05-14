import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { FinnhubNewsItem } from "@/services/news-service"
import {
  describeSentiment,
  type MarketSentiment,
} from "@/services/dashboard/market-sentiment-service"
import { cn } from "@/lib/utils"

interface NewsFeedProps {
  news: FinnhubNewsItem[]
  sentiment: MarketSentiment | null
}

const TONE_CLASS = {
  bearish: "text-red-500",
  neutral: "text-muted-foreground",
  bullish: "text-emerald-500",
} as const

function timeAgo(unix: number): string {
  const date = new Date(unix * 1000)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return "Just now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "1 day ago"
  return `${diffDays}d ago`
}

function truncateSummary(summary: string, maxLength = 180): string {
  if (summary.length <= maxLength) return summary
  return summary.slice(0, maxLength).trimEnd() + "..."
}

export function NewsFeed({ news, sentiment }: NewsFeedProps) {
  const items = news.slice(0, 3)
  const sentimentLabel = sentiment ? describeSentiment(sentiment.rating) : null

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div className="px-5 py-4">
        <Link
          href="/news"
          className="group inline-flex items-center gap-1.5 text-lg font-semibold text-foreground transition-colors hover:text-primary"
        >
          Market News
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="flex flex-col gap-0">
        {items.length === 0 ? (
          <div className="border-t border-border px-5 py-6 text-sm text-muted-foreground">
            No news available right now.
          </div>
        ) : (
          items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 border-t border-border px-5 py-4 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {item.source}
                </span>
                <span className="text-xs text-muted-foreground/50">·</span>
                <span className="text-xs text-muted-foreground">
                  {timeAgo(item.datetime)}
                </span>
              </div>
              <h3 className="text-sm font-semibold leading-snug text-foreground text-pretty group-hover:text-primary">
                {item.headline}
              </h3>
              {item.summary && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {truncateSummary(item.summary)}
                </p>
              )}
            </a>
          ))
        )}
      </div>
      {sentimentLabel && (
        <div className="px-5 pb-3 text-xs">
          <span className="text-muted-foreground">Market Today: </span>
          <span className={cn("font-medium", TONE_CLASS[sentimentLabel.tone])}>
            {sentimentLabel.description}
          </span>
        </div>
      )}
    </div>
  )
}
