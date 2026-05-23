"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Wallet, History, ArrowLeftRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/lib/format"
import { TabBarShell } from "@/components/tab-bar-shell"
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
    <TabBarShell
      action={
        <div className="flex items-center gap-1.5 px-4 py-2 text-sm md:px-6 md:py-0">
          <span className="text-muted-foreground">Balance:</span>
          <span className="font-semibold font-mono text-foreground">
            {currency === "USD" ? "$" : currency} {formatMoney(runningBalance)}
          </span>
        </div>
      }
    >
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
    </TabBarShell>
  )
}
