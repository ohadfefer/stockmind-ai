import { Newspaper } from "lucide-react"

export default function NewsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Newspaper className="size-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Market News
        </h1>
      </div>
      <p className="text-muted-foreground">
        General market news feed — coming soon.
      </p>
    </div>
  )
}
