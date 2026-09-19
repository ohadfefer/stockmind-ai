"use client"

import { Suspense, use } from "react"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import type { UserProfile } from "@/services/user-profile-service"
import type { StrategyPageData } from "@/services/settings/strategy-page-data"
import { StrategySettings } from "./strategy-settings"

export function StrategyContent({ profilePromise }: StrategyPageData) {
  return (
    <ErrorBoundary
      resetKeys={[profilePromise]}
      fallback={
        <SectionError
          title="Couldn't load your profile"
          description="We couldn't fetch your investing profile right now."
        />
      }
    >
      <Suspense fallback={<StrategySkeleton />}>
        <StrategySection profilePromise={profilePromise} />
      </Suspense>
    </ErrorBoundary>
  )
}

function StrategySection({ profilePromise }: { profilePromise: Promise<UserProfile> }) {
  const profile = use(profilePromise)
  return <StrategySettings initialProfile={profile} />
}

// Approximates the summary card plus the five question rows.
function StrategySkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <div className="h-6 w-32 rounded bg-secondary" />
          <div className="h-4 w-36 rounded bg-secondary" />
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
          <div className="h-5 w-24 rounded bg-secondary" />
          <div className="h-5 w-full rounded bg-secondary" />
          <div className="h-5 w-3/4 rounded bg-secondary" />
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-4 py-5">
            <div className="flex flex-1 flex-col gap-3">
              <div className="h-5 w-1/2 rounded bg-secondary" />
              <div className="h-4 w-3/4 rounded bg-secondary" />
              <div className="h-7 w-24 rounded-md bg-secondary" />
            </div>
            <div className="size-9 rounded-full bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}
