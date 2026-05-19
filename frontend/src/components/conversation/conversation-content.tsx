"use client"

import { Suspense, use } from "react"
import { Sparkles } from "lucide-react"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import { ChatPanel } from "@/components/conversation/chat-panel"
import type { ConversationPageData } from "@/services/conversation/conversation-page-data"
import type { ConversationMessage } from "@/services/ai/conversation-service"

export function ConversationContent({
  conversationId,
  initialPrompt,
  messagesPromise,
}: ConversationPageData) {
  return (
    <ErrorBoundary
      resetKeys={[messagesPromise]}
      fallback={
        <SectionError
          title="Couldn't load this conversation"
          description="We couldn't fetch your message history right now."
        />
      }
    >
      <Suspense fallback={<ChatPanelSkeleton />}>
        <ChatPanelLoader
          conversationId={conversationId}
          initialPrompt={initialPrompt}
          messagesPromise={messagesPromise}
        />
      </Suspense>
    </ErrorBoundary>
  )
}

function ChatPanelLoader({
  conversationId,
  initialPrompt,
  messagesPromise,
}: {
  conversationId: number | null
  initialPrompt: string | null
  messagesPromise: Promise<ConversationMessage[]>
}) {
  const initialMessages = use(messagesPromise)
  return (
    // key per thread: navigating /conversation?id=A → ?id=B re-renders this
    // route without remounting (id is a search param, not a segment), so
    // ChatPanel's useState(initialMessages) seed would otherwise keep the old
    // thread's messages. Remounting on id change re-seeds it from scratch.
    <ChatPanel
      key={conversationId ?? "new"}
      conversationId={conversationId}
      initialMessages={initialMessages}
      initialPrompt={initialPrompt}
    />
  )
}

// Mirrors the ChatPanel chrome (header + input) so an existing-thread load
// reads as the chat filling in, not the page reflowing. The new-chat path
// resolves synchronously and never shows this.
function ChatPanelSkeleton() {
  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">AI Advisor</h1>
        </div>
        <div className="h-8 w-24 animate-pulse rounded-md bg-secondary" />
      </div>

      <div className="flex-1 overflow-hidden py-4">
        <div className="mx-auto flex w-full max-w-[880px] animate-pulse flex-col gap-6">
          <div className="flex justify-end">
            <div className="h-10 w-1/2 rounded-2xl bg-primary/10" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-11/12 rounded bg-secondary" />
            <div className="h-4 w-full rounded bg-secondary" />
            <div className="h-4 w-3/4 rounded bg-secondary" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-1/3 rounded-2xl bg-primary/10" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 w-full rounded bg-secondary" />
            <div className="h-4 w-5/6 rounded bg-secondary" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[880px] pt-3">
        <div className="h-[60px] w-full animate-pulse rounded-lg border border-border bg-card" />
      </div>
    </div>
  )
}
