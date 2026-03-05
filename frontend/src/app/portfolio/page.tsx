"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  ArrowUpDown,
  FileDown,
  Sparkles,
  Clock,
} from "lucide-react"
import { WatchlistTab } from "@/components/portfolio/watchlist-tab"
import { PortfolioTab } from "@/components/portfolio/portfolio-tab"
import { AlertsTab } from "@/components/portfolio/alerts-tab"

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">
            Portfolio Analysis
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            Last updated 2 minutes ago
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
            <FileDown className="size-4" />
            Export CSV
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">
            <Sparkles className="size-4" />
            Analyze with AI
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="portfolio" className="gap-6">
        <div className="flex items-center justify-between">
          <TabsList className="h-10 bg-secondary">
            <TabsTrigger value="watchlist" className="h-8 px-4 text-sm">
              Watchlist
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="h-8 px-4 text-sm">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="alerts" className="h-8 px-4 text-sm">
              Alerts
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <ArrowUpDown className="size-4" />
                  Sort by
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-card border-border"
              >
                <DropdownMenuItem className="text-foreground">
                  Ticker (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground">
                  Price (High-Low)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground">
                  Change % (High-Low)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground">
                  AI Score (High-Low)
                </DropdownMenuItem>
                <DropdownMenuItem className="text-foreground">
                  Market Cap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              <Plus className="size-4" />
              Add Stock
            </button>
          </div>
        </div>

        <TabsContent value="watchlist">
          <WatchlistTab />
        </TabsContent>

        <TabsContent value="portfolio">
          <PortfolioTab />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
