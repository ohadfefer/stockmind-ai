"use client"

import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  FileDown,
  Sparkles,
  Clock,
} from "lucide-react"
import { PortfolioTab } from "@/components/portfolio/portfolio-tab"
import { AlertsTab } from "@/components/portfolio/alerts-tab"
import { PortfolioTabsBar } from "@/components/portfolio/portfolio-tabs-bar"

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
        <PortfolioTabsBar />

        {/* the content inside TabsContent should be wrapped inside a component - like the other tabs */}
        <TabsContent value="analyze">
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <Sparkles className="mb-3 size-8 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              AI Portfolio Analysis
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">Coming soon</p>
          </div>
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
