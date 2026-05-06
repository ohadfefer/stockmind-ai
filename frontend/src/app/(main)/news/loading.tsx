import { NewsListSkeleton } from "@/components/news/news-list"

export default function Loading() {
  return (
    <div className="space-y-4">
      <NewsListSkeleton />
    </div>
  )
}
