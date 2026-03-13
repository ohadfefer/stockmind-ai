import { Newspaper } from "lucide-react"
import { NewsFeed } from "@/components/details/news-feed"

export default function NewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Newspaper className="size-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Market News
        </h1>
      </div>
      <NewsFeed />
    </div>
  )
}
