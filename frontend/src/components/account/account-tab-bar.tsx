"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Wallet, History, ArrowLeftRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { key: "balances", label: "Account Balances", icon: Wallet },
  { key: "history", label: "Account History", icon: History },
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "transfer", label: "Transfer", icon: ArrowLeftRight },
] as const

export type AccountTab = (typeof tabs)[number]["key"]

interface AccountTabBarProps {
  runningBalance: number
  currency: string
}

export function AccountTabBar({ runningBalance, currency }: AccountTabBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as AccountTab) || "balances"

  return (
    <div className="flex items-center justify-between border-b">
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              onClick={() => router.push(`/account?tab=${tab.key}`)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
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
      <div className="flex items-center gap-1.5 px-4 text-sm">
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
