import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ClipboardList } from "lucide-react"
import Link from "next/link"

export function PortfolioTabsBar() {
  return (
    <div className="flex items-center justify-between">
      <TabsList className="h-10 bg-secondary">
        <TabsTrigger value="analyze" className="h-8 px-4 text-sm">
          Analyze
        </TabsTrigger>
        <TabsTrigger value="portfolio" className="h-8 px-4 text-sm">
          Portfolio
        </TabsTrigger>
        <TabsTrigger value="alerts" className="h-8 px-4 text-sm">
          Alerts
        </TabsTrigger>
      </TabsList>

      <div className="flex items-center gap-3">
        <Link
          href="/portfolio/orders"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          <ClipboardList className="size-4" />
          Orders
        </Link>
        <Link
          href="/portfolio/trade"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Trade
        </Link>
      </div>
    </div>
  )
}
