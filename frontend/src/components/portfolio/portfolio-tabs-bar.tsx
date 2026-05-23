"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Sparkles, BarChart3, Bell, Plus, ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"
import { TabBarShell } from "@/components/tab-bar-shell"
import Link from "next/link"

const tabs = [
  { key: "portfolio", label: "Portfolio", icon: BarChart3 },
  { key: "analyze", label: "Analyze", icon: Sparkles },
  { key: "alerts", label: "Alerts", icon: Bell },
] as const

export type PortfolioTabKey = (typeof tabs)[number]["key"]

export function PortfolioTabsBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as PortfolioTabKey) || "portfolio"

  return (
    <TabBarShell
      action={
        <div className="flex items-center justify-end gap-3 px-4 py-2 md:px-6 md:py-0">
          <Link
            href="/portfolio/orders"
            className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-foreground/70"
          >
            <ClipboardList className="size-4" />
            Orders
          </Link>
          <Link
            href="/portfolio/trade"
            className="flex items-center gap-2 text-sm font-semibold text-primary brightness-125 transition-colors hover:brightness-100"
          >
            <Plus className="size-4" />
            Trade
          </Link>
        </div>
      }
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            onClick={() => router.push(`/portfolio?tab=${tab.key}`)}
            className={cn(
              "flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
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
