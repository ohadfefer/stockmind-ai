"use client"

import { useSearchParams } from "next/navigation"
import { Sparkles, BarChart3, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { TabBarShell } from "@/components/tab-bar-shell"

const tabs = [
  { key: "portfolio", label: "Portfolio", icon: BarChart3 },
  { key: "analyze", label: "Analyze", icon: Sparkles },
  { key: "alerts", label: "Alerts", icon: Bell },
] as const

export type PortfolioTabKey = (typeof tabs)[number]["key"]

/**
 * Switches the active tab without a navigation. Every tab's data is already
 * on the client — PortfolioTabContent holds all three promises and picks by
 * useSearchParams — so router.push here was a full server round trip that
 * re-ran the whole portfolio load (account chain, quotes, review) and, now
 * that the route has a loading file, would flash its skeleton too. Next's
 * router syncs useSearchParams from native pushState, so the content swaps
 * in place; pushState rather than replaceState keeps a history entry per
 * tab, as router.push did.
 */
export function switchPortfolioTab(tab: PortfolioTabKey) {
  window.history.pushState(null, "", `/portfolio?tab=${tab}`)
}

export function PortfolioTabsBar() {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as PortfolioTabKey) || "portfolio"

  return (
    <TabBarShell>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            onClick={() => switchPortfolioTab(tab.key)}
            className={cn(
              "flex shrink-0 items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px md:text-sm",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        )
      })}
    </TabBarShell>
  )
}
