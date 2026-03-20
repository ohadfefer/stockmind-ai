"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Wallet, History } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { key: "balances", label: "Account Balances", icon: Wallet },
  { key: "history", label: "Account History", icon: History },
] as const

export type AccountTab = (typeof tabs)[number]["key"]

export function AccountTabBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as AccountTab) || "balances"

  return (
    <div className="flex items-center gap-1 border-b">
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
  )
}
