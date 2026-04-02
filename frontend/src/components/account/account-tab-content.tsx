"use client"

import { useSearchParams } from "next/navigation"
import { AccountBalances } from "./account-balances"
import { AccountHistory } from "./account-history"
import { AccountTransfer } from "./account-transfer"
import { AccountPerformance } from "./account-performance"
import type { AccountTab } from "./account-tab-bar"
import type { AccountDetails, HistoryEntry } from "@/services/account-service"
import type { PositionHistoryEntry } from "@/services/position/position-history-service"

interface AccountTabContentProps {
  account: AccountDetails | null
  history: HistoryEntry[]
  positionHistory: PositionHistoryEntry[]
}

export function AccountTabContent({ account, history, positionHistory }: AccountTabContentProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as AccountTab) || "balances"

  if (activeTab === "history") {
    return <AccountHistory entries={history} />
  }

  if (activeTab === "performance") {
    return <AccountPerformance entries={positionHistory} />
  }

  if (activeTab === "transfer") {
    return <AccountTransfer currency={account?.currency ?? "USD"} />
  }

  return <AccountBalances account={account} />
}
