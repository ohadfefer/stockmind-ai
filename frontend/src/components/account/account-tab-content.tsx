"use client"

import { useSearchParams } from "next/navigation"
import { AccountBalances } from "./account-balances"
import { AccountHistory } from "./account-history"
import { AccountTransfer } from "./account-transfer"
import { AccountPerformance } from "./account-performance"
import type { AccountTab } from "./account-tab-bar"
import type { AccountDetails, HistoryEntry } from "@/services/account-service"
import type { PortfolioDailyValue } from "@/services/position/portfolio-daily-value-service"

interface AccountTabContentProps {
  account: AccountDetails | null
  history: HistoryEntry[]
  dailyValues: PortfolioDailyValue[]
}

export function AccountTabContent({ account, history, dailyValues }: AccountTabContentProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as AccountTab) || "balances"

  if (activeTab === "history") {
    return <AccountHistory entries={history} />
  }

  if (activeTab === "performance") {
    return <AccountPerformance dailyValues={dailyValues} />
  }

  if (activeTab === "transfer") {
    return <AccountTransfer currency={account?.currency ?? "USD"} />
  }

  return <AccountBalances account={account} />
}
