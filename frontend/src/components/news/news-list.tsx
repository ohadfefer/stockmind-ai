import { Skeleton } from "@/components/ui/skeleton"
import type { FinnhubNewsItem } from "@/services/news-service"

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

interface NewsListProps {
  items: FinnhubNewsItem[]
  emptyMessage?: string
  compact?: boolean
}

export function NewsList({ items, emptyMessage = "No recent news found.", compact = false }: NewsListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={
            compact
              ? "group flex cursor-pointer flex-col gap-1 rounded-lg p-3 transition-colors hover:bg-muted/50"
              : "group flex cursor-pointer items-start gap-4 rounded-lg p-5 transition-colors hover:bg-muted/50"
          }
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
            {!compact && item.summary && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {truncateSummary(item.summary)}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}

export function NewsListSkeleton({ count = 3, compact = false }: { count?: number; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={compact ? "flex flex-col gap-2 rounded-lg p-3" : "flex gap-4 rounded-lg p-5"}>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-4 w-full" />
            {!compact && <Skeleton className="h-3 w-3/4" />}
          </div>
        </div>
      ))}
    </div>
  )
}
