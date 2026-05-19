"use client"

import { Suspense, use } from "react"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import { ConversationHistoryList } from "@/components/conversation/history-list"
import type { ConversationHistoryPageData } from "@/services/conversation/conversation-history-page-data"
import type { ConversationListItem } from "@/services/ai/conversation-service"

export function ConversationHistoryContent({
  conversationsPromise,
}: ConversationHistoryPageData) {
  return (
    <ErrorBoundary
      resetKeys={[conversationsPromise]}
      fallback={
        <SectionError
          title="Couldn't load history"
          description="We couldn't fetch your past conversations right now."
        />
      }
    >
      <Suspense fallback={<HistoryListSkeleton />}>
        <HistoryListSection conversationsPromise={conversationsPromise} />
      </Suspense>
    </ErrorBoundary>
  )
}

function HistoryListSection({
  conversationsPromise,
}: {
  conversationsPromise: Promise<ConversationListItem[]>
}) {
  const items = use(conversationsPromise)
  return <ConversationHistoryList items={items} />
}

// Mirrors the list (sort control on the right, then rows) but kept light:
// new users with no history collapse straight to the empty state, so a
// short stub avoids a heavy skeleton flashing into a single empty line.
function HistoryListSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="flex justify-end">
        <div className="h-8 w-28 rounded-lg bg-secondary" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="h-4 w-1/2 rounded bg-secondary" />
            <div className="h-3 w-3/4 rounded bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  )
}
