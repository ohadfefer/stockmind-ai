"use client"

import { Suspense, use } from "react"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import { TabBarShell } from "@/components/tab-bar-shell"
import { AccountTabBar } from "./account-tab-bar"
import { AccountBalances } from "./account-balances"
import { AccountHistory } from "./account-history"
import { AccountTransfer } from "./account-transfer"
import { AccountPerformance } from "./account-performance"
import type { AccountPageData } from "@/services/account/account-page-data"
import type { AccountDetails, HistoryEntry } from "@/services/account/account-service"
import type { PortfolioDailyValue } from "@/services/position/portfolio-daily-value-service"

export function AccountContent({
  tab,
  accountPromise,
  historyPromise,
  dailyValuesPromise,
}: AccountPageData) {
  return (
    <div className="flex flex-col gap-6">
      <ErrorBoundary
        resetKeys={[accountPromise]}
        fallback={<AccountTabBar runningBalance={0} currency="USD" />}
      >
        <Suspense fallback={<TabBarSkeleton />}>
          <TabBarSection accountPromise={accountPromise} />
        </Suspense>
      </ErrorBoundary>

      {tab === "history" && historyPromise ? (
        <ErrorBoundary
          resetKeys={[historyPromise]}
          fallback={
            <SectionError
              title="Couldn't load account history"
              description="We couldn't fetch your transactions right now."
            />
          }
        >
          <Suspense fallback={<HistorySkeleton />}>
            <HistorySection historyPromise={historyPromise} />
          </Suspense>
        </ErrorBoundary>
      ) : tab === "performance" && dailyValuesPromise ? (
        <ErrorBoundary
          resetKeys={[dailyValuesPromise]}
          fallback={
            <SectionError
              title="Couldn't load performance"
              description="We couldn't fetch your portfolio history right now."
            />
          }
        >
          <Suspense fallback={<PerformanceSkeleton />}>
            <PerformanceSection dailyValuesPromise={dailyValuesPromise} />
          </Suspense>
        </ErrorBoundary>
      ) : tab === "transfer" ? (
        <ErrorBoundary
          resetKeys={[accountPromise]}
          fallback={
            <SectionError
              title="Couldn't load transfer"
              description="We couldn't load your account right now."
            />
          }
        >
          <Suspense fallback={<TransferSkeleton />}>
            <TransferSection accountPromise={accountPromise} />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <ErrorBoundary
          resetKeys={[accountPromise]}
          fallback={
            <SectionError
              title="Couldn't load balances"
              description="We couldn't load your account right now."
            />
          }
        >
          <Suspense fallback={<BalancesSkeleton />}>
            <BalancesSection accountPromise={accountPromise} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  )
}

function TabBarSection({
  accountPromise,
}: {
  accountPromise: Promise<AccountDetails | null>
}) {
  const account = use(accountPromise)
  return (
    <AccountTabBar
      runningBalance={account?.running_balance ?? 0}
      currency={account?.currency ?? "USD"}
    />
  )
}

function BalancesSection({
  accountPromise,
}: {
  accountPromise: Promise<AccountDetails | null>
}) {
  const account = use(accountPromise)
  return <AccountBalances account={account} />
}

function TransferSection({
  accountPromise,
}: {
  accountPromise: Promise<AccountDetails | null>
}) {
  const account = use(accountPromise)
  return <AccountTransfer currency={account?.currency ?? "USD"} />
}

function HistorySection({
  historyPromise,
}: {
  historyPromise: Promise<HistoryEntry[]>
}) {
  const entries = use(historyPromise)
  return <AccountHistory entries={entries} />
}

function PerformanceSection({
  dailyValuesPromise,
}: {
  dailyValuesPromise: Promise<PortfolioDailyValue[]>
}) {
  const dailyValues = use(dailyValuesPromise)
  return <AccountPerformance dailyValues={dailyValues} />
}

function TabBarSkeleton() {
  return (
    <TabBarShell
      className="animate-pulse"
      scrollClassName="py-2.5"
      action={
        <div className="mx-4 my-2 h-5 w-28 rounded bg-secondary md:mx-6 md:my-0" />
      }
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-5 w-32 shrink-0 rounded bg-secondary" />
      ))}
    </TabBarShell>
  )
}

// Three info cards, matching AccountBalances' sm:grid-cols-3 layout.
function BalancesSkeleton() {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="h-4 w-32 rounded bg-secondary" />
          <div className="mt-3 h-6 w-40 rounded bg-secondary" />
        </div>
      ))}
    </div>
  )
}

// Year/month filter row + table, matching AccountHistory.
function HistorySkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-16 rounded bg-secondary" />
        ))}
      </div>
      <div className="rounded-lg border bg-card">
        <div className="h-10 w-full rounded-t bg-secondary" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-t px-4 py-3">
            <div className="h-4 w-full rounded bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Tall graph + heatmap grid, matching AccountPerformance.
function PerformanceSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-72 w-full rounded-lg border bg-card" />
      <div className="h-40 w-full rounded-lg border bg-card" />
    </div>
  )
}

// Centered transfer form card, matching AccountTransfer's
// `mx-auto max-w-lg` wrapper and inner card.
function TransferSkeleton() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="animate-pulse space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <div className="h-5 w-40 rounded bg-secondary" />
          <div className="h-4 w-64 rounded bg-secondary" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 w-full rounded-lg bg-secondary" />
          <div className="h-12 w-full rounded-lg bg-secondary" />
        </div>
        <div className="h-9 w-full rounded bg-secondary" />
        <div className="h-9 w-full rounded bg-secondary" />
        <div className="h-10 w-full rounded bg-secondary" />
      </div>
    </div>
  )
}
