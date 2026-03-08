import { Newspaper } from "lucide-react"

interface NewsItem {
  source: string
  timeAgo: string
  title: string
}

const newsItems: NewsItem[] = [
  {
    source: "Finviz - Stock Screener",
    timeAgo: "1 day ago",
    title: "Agilent Technologies, Inc. (A) Price Target Cut to $155 at Baird",
  },
  {
    source: "MarketWatch",
    timeAgo: "2 days ago",
    title: "Agilent reports mixed Q1 results, revenue beats expectations",
  },
  {
    source: "Seeking Alpha",
    timeAgo: "3 days ago",
    title: "Agilent Technologies: Navigating headwinds with strong fundamentals",
  },
]

export function NewsFeed() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">In the news</h3>

      <div className="space-y-4">
        {newsItems.map((item, i) => (
          <div
            key={i}
            className="group flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{item.source}</span>
                <span>·</span>
                <span>{item.timeAgo}</span>
              </div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary">
                {item.title}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
              <Newspaper className="size-5 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
