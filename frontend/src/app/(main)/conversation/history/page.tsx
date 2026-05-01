import Link from "next/link"
import { History, MessageSquare, Sparkles } from "lucide-react"
import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account-service"
import {
  listConversationsForAccount,
  type ConversationListItem,
} from "@/services/ai/conversation-service"

const DEFAULT_TITLE = "New chat"
const PREVIEW_MAX = 80

export default async function ConversationHistoryPage() {
  const conversations = await loadConversations()

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 py-6">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <History className="size-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">History</h1>
      </div>

      {conversations.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="flex flex-col gap-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <ConversationRow item={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

async function loadConversations(): Promise<ConversationListItem[]> {
  const session = await auth0.getSession()
  if (!session) return []
  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) return []
  const accountId = await getDefaultAccountId(userId)
  if (!accountId) return []
  return listConversationsForAccount(accountId, 50)
}

function ConversationRow({ item }: { item: ConversationListItem }) {
  const label = displayLabel(item)
  return (
    <Link
      href={`/conversation?id=${item.id}`}
      className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary"
    >
      <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">
          {label}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatRelative(item.updatedAt)}</span>
          <span aria-hidden>·</span>
          <span>
            {item.messageCount} {item.messageCount === 1 ? "message" : "messages"}
          </span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <Sparkles className="size-6 text-primary" />
      <p className="text-sm font-medium text-foreground">No conversations yet</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Start a chat from the AI Advisor. Your past threads will show up here so
        you can pick up where you left off.
      </p>
      <Link
        href="/conversation"
        className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        Open AI Advisor
      </Link>
    </div>
  )
}

function displayLabel(item: ConversationListItem): string {
  if (item.title && item.title !== DEFAULT_TITLE) return item.title
  if (item.preview) {
    const cleaned = item.preview.replace(/\s+/g, " ").trim()
    if (!cleaned) return DEFAULT_TITLE
    return cleaned.length > PREVIEW_MAX
      ? cleaned.slice(0, PREVIEW_MAX - 1).trimEnd() + "…"
      : cleaned
  }
  return DEFAULT_TITLE
}

function formatRelative(date: Date): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (diffSec < 60) return "just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
