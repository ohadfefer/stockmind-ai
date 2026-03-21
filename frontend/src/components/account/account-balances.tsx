"use client"

import { DollarSign, Hash, BadgeDollarSign } from "lucide-react"
import type { AccountDetails } from "@/services/account-service"

interface AccountBalancesProps {
  account: AccountDetails | null
}

export function AccountBalances({ account }: AccountBalancesProps) {
  if (!account) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Unable to load account details.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hash className="size-4" />
          Account Number
        </div>
        <p className="mt-2 text-xl font-semibold font-mono text-foreground">
          {account.account_number}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DollarSign className="size-4" />
          Running Balance
        </div>
        <p className="mt-2 text-xl font-semibold font-mono text-foreground">
          {account.currency === "USD" ? "$" : account.currency}{" "}
          {account.running_balance.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BadgeDollarSign className="size-4" />
          Currency
        </div>
        <p className="mt-2 text-xl font-semibold text-foreground">
          {account.currency}
        </p>
      </div>
    </div>
  )
}
