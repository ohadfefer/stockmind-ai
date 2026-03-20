"use client"

import { useSearchParams } from "next/navigation"
import { AccountBalances } from "./account-balances"
import { AccountHistory } from "./account-history"
import type { AccountTab } from "./account-tab-bar"

export function AccountTabContent() {
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") as AccountTab) || "balances"

  if (activeTab === "history") {
    return <AccountHistory />
  }

  return <AccountBalances />
}
