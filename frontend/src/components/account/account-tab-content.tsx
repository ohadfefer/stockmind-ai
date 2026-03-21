"use client"

import { useSearchParams } from "next/navigation"
import { AccountBalances } from "./account-balances"
import { AccountHistory } from "./account-history"
import type { AccountTab } from "./account-tab-bar"
import type { AccountDetails, HistoryEntry } from "@/services/account-service"

interface AccountTabContentProps {
  account: AccountDetails | null
  history: HistoryEntry[]
}

export function AccountTabContent({ account, history }: AccountTabContentProps) {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as AccountTab) || "balances"

  if (activeTab === "history") {
    return <AccountHistory entries={history} />
  }

  return <AccountBalances account={account} />
}
