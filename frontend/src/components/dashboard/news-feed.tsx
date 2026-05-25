import { Fragment, type ReactNode } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { FinnhubNewsItem } from "@/services/news-service"
import {
  describeSentiment,
  type MarketSentiment,
  type SentimentLabel,
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
      {items.length === 0 ? (
        <div className="px-5 pb-6 text-sm text-muted-foreground">
          No news available right now.
        </div>
      ) : (
        <>
          {/* Mobile: horizontal swipe, no card border — just gap */}
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-4 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-64 shrink-0 snap-start flex-col gap-1.5"
              >
                <NewsItemContent item={item} />
              </a>
            ))}
          </div>

          {/* Desktop: vertical list, no separators — just gap. Fills the card
              height so the last item's footer row bottom-aligns with the
              heatmap caption in the card beside it. */}
          <div className="hidden flex-1 flex-col justify-between gap-5 px-5 pb-5 md:flex">
            {items.map((item, index) => (
              <Fragment key={item.id}>
                {index > 0 && (
                  <div aria-hidden className="h-px shrink-0 bg-border" />
                )}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-1.5"
                >
                  <NewsItemContent
                    item={item}
                    trailing={
                      index === items.length - 1 && sentimentLabel ? (
                        <SentimentTag label={sentimentLabel} />
                      ) : null
                    }
                  />
                </a>
              </Fragment>
            ))}
          </div>
        </>
      )}
      {/* Mobile: sentiment sits below the swipe row */}
      {sentimentLabel && (
        <div className="px-5 pb-3 md:hidden">
          <SentimentTag label={sentimentLabel} />
        </div>
      )}
    </div>
  )
}

function NewsItemContent({
  item,
  trailing,
}: {
  item: FinnhubNewsItem
  trailing?: ReactNode
}) {
  return (
    <>
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground text-pretty group-hover:text-primary">
        {item.headline}
      </h3>
      {item.summary && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.summary}
        </p>
      )}
      <div className="mt-0.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{item.source}</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-muted-foreground">{timeAgo(item.datetime)}</span>
        </div>
        {trailing}
      </div>
    </>
  )
}

function SentimentTag({ label }: { label: SentimentLabel }) {
  return (
    <span className="whitespace-nowrap text-xs">
      <span className="text-muted-foreground">Market Today: </span>
      <span className={cn("font-medium", TONE_CLASS[label.tone])}>
        {label.description}
      </span>
    </span>
  )
}
