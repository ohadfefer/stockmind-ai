"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Wallet, History, ArrowLeftRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { parseAccountTab, type AccountTab } from "./account-tabs"

const tabs = [
  { key: "balances", label: "Account Balances", icon: Wallet },
  { key: "history", label: "Account History", icon: History },
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "transfer", label: "Transfer", icon: ArrowLeftRight },
] as const satisfies readonly { key: AccountTab; label: string; icon: unknown }[]

interface AccountTabBarProps {
  runningBalance: number
  currency: string
}

export function AccountTabBar({ runningBalance, currency }: AccountTabBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = parseAccountTab(searchParams.get("tab"))

  return (
    // -mx-* cancels parent <main>'s p-4 md:p-6 so the tab strip + divider
    // span edge-to-edge on mobile. Inner rows re-add px-4 md:px-6 to keep
    // content aligned with the rest of the page.
    <div className="-mx-4 flex flex-col md:-mx-6 md:flex-row md:items-center md:justify-between md:border-b">
      <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-border px-4 md:border-b-0 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              onClick={() => router.push(`/account?tab=${tab.key}`)}
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
      </div>
      <div className="flex items-center gap-1.5 px-4 py-2 text-sm md:px-6 md:py-0">
        <span className="text-muted-foreground">Balance:</span>
        <span className="font-semibold font-mono text-foreground">
          {currency === "USD" ? "$" : currency}{" "}
          {runningBalance.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  )
}
