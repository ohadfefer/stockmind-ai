"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Check,
  ChevronDown,
  MessageSquare,
  Pencil,
  Pin,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  deleteConversation,
  renameConversation,
  setConversationPinned,
} from "@/actions/conversation"
import type { ConversationListItem } from "@/services/ai/conversation-service"

type SortMode = "newest" | "pinned" | "oldest"

const SORT_LABEL: Record<SortMode, string> = {
  newest: "Newest",
  pinned: "Pinned",
  oldest: "Oldest",
}

const DEFAULT_TITLE = "New chat"
const PREVIEW_MAX = 80
const MAX_TITLE_LENGTH = 200

const iconBtn =
  "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"

// Only one row can be in an "open" UI state (editing or confirming-delete) at
// any time. Modeling that as a single union — rather than two parallel id
// maps — makes it impossible to leave a stale rename open when the user
// pivots to delete (or vice versa).
type ActiveRow =
  | { id: number; mode: "editing" }
  | { id: number; mode: "confirming" }
  | null

export function ConversationHistoryList({
  items,
}: {
  items: ConversationListItem[]
}) {
  const router = useRouter()
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set())
  const [active, setActive] = useState<ActiveRow>(null)
  // Optimistic pin overlay: id → effective pinnedAt while a toggle is in
  // flight (and after, until the next props update fills it in). Lets the
  // row re-color and pop to the top immediately without waiting for the
  // server round-trip.
  const [pinOverrides, setPinOverrides] = useState<Map<number, Date | null>>(
    new Map(),
  )
  const [sortMode, setSortMode] = useState<SortMode>("newest")

  const decorated = items
    .filter((i) => !removedIds.has(i.id))
    .map((item) => {
      const override = pinOverrides.get(item.id)
      const pinnedAt =
        pinOverrides.has(item.id) ? (override as Date | null) : item.pinnedAt
      return { ...item, pinnedAt }
    })

  // "Pinned" mode is a filter, not a sort priority: only show pinned items.
  // Newest and Oldest order all items by updatedAt.
  const visible = decorated
    .filter((item) => sortMode !== "pinned" || item.pinnedAt !== null)
    .sort((a, b) => {
      if (sortMode === "oldest") {
        return a.updatedAt.getTime() - b.updatedAt.getTime()
      }
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })

  if (decorated.length === 0) return <EmptyState />

  async function handleDelete(id: number) {
    setRemovedIds((s) => new Set(s).add(id))
    try {
      await deleteConversation(id)
      router.refresh()
    } catch (err) {
      console.error("conversation delete failed:", err)
      setRemovedIds((s) => {
        const n = new Set(s)
        n.delete(id)
        return n
      })
      toast.error("Couldn't delete conversation. Try again.")
    }
  }

  async function handleRename(id: number, title: string) {
    try {
      await renameConversation(id, title)
      router.refresh()
    } catch (err) {
      console.error("conversation rename failed:", err)
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Couldn't rename conversation. Try again.",
      )
    } finally {
      setActive((a) => (a?.id === id && a.mode === "editing" ? null : a))
    }
  }

  async function handleTogglePin(id: number, nowPinned: boolean) {
    const optimistic: Date | null = nowPinned ? new Date() : null
    setPinOverrides((m) => new Map(m).set(id, optimistic))
    try {
      await setConversationPinned(id, nowPinned)
      router.refresh()
    } catch (err) {
      console.error("conversation pin toggle failed:", err)
      setPinOverrides((m) => {
        const n = new Map(m)
        n.delete(id)
        return n
      })
      toast.error(
        nowPinned ? "Couldn't pin conversation." : "Couldn't unpin conversation.",
      )
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <SortDropdown value={sortMode} onChange={setSortMode} />
      </div>
      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No pinned conversations yet. Pin a conversation to find it here.
        </div>
      ) : (
      <ul className="flex flex-col gap-2">
        {visible.map((item) => (
          <li key={item.id}>
            <ConversationRow
              item={item}
              editing={active?.id === item.id && active.mode === "editing"}
              confirming={
                active?.id === item.id && active.mode === "confirming"
              }
              onStartRename={() =>
                setActive({ id: item.id, mode: "editing" })
              }
              onCancelRename={() =>
                setActive((a) =>
                  a?.id === item.id && a.mode === "editing" ? null : a,
                )
              }
              onConfirmingChange={(v) =>
                setActive(v ? { id: item.id, mode: "confirming" } : null)
              }
              onSubmitRename={(t) => handleRename(item.id, t)}
              onDelete={() => handleDelete(item.id)}
              onTogglePin={() => handleTogglePin(item.id, !item.pinnedAt)}
            />
          </li>
        ))}
      </ul>
      )}
    </div>
  )
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortMode
  onChange: (mode: SortMode) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Sort: {SORT_LABEL[value]}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onChange("newest")}>
          Sort: Newest
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("pinned")}>
          Sort: Pinned
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange("oldest")}>
          Sort: Oldest
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface RowProps {
  item: ConversationListItem
  editing: boolean
  confirming: boolean
  onStartRename: () => void
  onCancelRename: () => void
  onConfirmingChange: (confirming: boolean) => void
  onSubmitRename: (title: string) => void
  onDelete: () => void
  onTogglePin: () => void
}

function ConversationRow({
  item,
  editing,
  confirming,
  onStartRename,
  onCancelRename,
  onConfirmingChange,
  onSubmitRename,
  onDelete,
  onTogglePin,
}: RowProps) {
  const label = displayLabel(item)
  const pinned = item.pinnedAt !== null
  const [draft, setDraft] = useState(label)

  if (editing) {
    function commit() {
      const trimmed = draft.trim().slice(0, MAX_TITLE_LENGTH)
      if (!trimmed || trimmed === label) {
        onCancelRename()
        return
      }
      onSubmitRename(trimmed)
    }
    return (
      <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <input
            autoFocus
            value={draft}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commit()
              } else if (e.key === "Escape") {
                e.preventDefault()
                onCancelRename()
              }
            }}
            className="w-full rounded border border-border bg-background px-2 py-1 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatRelative(item.updatedAt)}</span>
            <span aria-hidden>·</span>
            <span>
              {item.messageCount}{" "}
              {item.messageCount === 1 ? "message" : "messages"}
            </span>
          </div>
        </div>
        <div className="ml-auto grid w-[60px] grid-cols-[28px_28px] items-center justify-end gap-1">
          <button className={iconBtn} onClick={onCancelRename}>
            <X className="size-4" />
            <span className="sr-only">Cancel rename</span>
          </button>
          <button className={iconBtn} onClick={commit}>
            <Check className="size-4" />
            <span className="sr-only">Save rename</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative">
      <Link
        href={`/conversation?id=${item.id}`}
        className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 pr-28 transition-colors hover:bg-secondary"
      >
        <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={`truncate text-sm font-medium ${
              pinned ? "text-primary" : "text-foreground"
            }`}
          >
            {label}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatRelative(item.updatedAt)}</span>
            <span aria-hidden>·</span>
            <span>
              {item.messageCount}{" "}
              {item.messageCount === 1 ? "message" : "messages"}
            </span>
          </div>
        </div>
      </Link>
      <div
        className={`pointer-events-none absolute right-3 top-1/2 flex w-[92px] -translate-y-1/2 items-center justify-end gap-1 transition-opacity ${
          confirming ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {confirming ? (
          <>
            <button
              className={`pointer-events-auto ${iconBtn}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onConfirmingChange(false)
              }}
            >
              <X className="size-4" />
              <span className="sr-only">Cancel</span>
            </button>
            <button
              className={`pointer-events-auto ${iconBtn}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onConfirmingChange(false)
                onDelete()
              }}
            >
              <Check className="size-4" />
              <span className="sr-only">Confirm remove</span>
            </button>
          </>
        ) : (
          <>
            <button
              className={`pointer-events-auto ${iconBtn} ${
                pinned ? "text-primary hover:text-primary" : ""
              }`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onTogglePin()
              }}
            >
              <Pin className={`size-4 ${pinned ? "fill-primary" : ""}`} />
              <span className="sr-only">{pinned ? "Unpin" : "Pin"}</span>
            </button>
            <button
              className={`pointer-events-auto ${iconBtn}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setDraft(label)
                onStartRename()
              }}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Rename</span>
            </button>
            <button
              className={`pointer-events-auto ${iconBtn}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onConfirmingChange(true)
              }}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Remove</span>
            </button>
          </>
        )}
      </div>
    </div>
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
