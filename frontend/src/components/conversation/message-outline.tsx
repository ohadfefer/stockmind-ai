"use client"

import { useMemo } from "react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  useMessageScroller,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller"
import { cn } from "@/lib/utils"

export interface OutlineEntry {
  id: string
  label: string
}

// The rail is a position indicator, so it has to stay a readable height however
// long the thread runs. Past this many questions we show a window of ticks
// instead of one per question.
const MAX_TICKS = 18

/**
 * Jump menu for a conversation: a tick rail marking each question, and a
 * hover list that scrolls the reader to any of them. The highlighted tick
 * tracks the anchored turn, so the rail doubles as a "where am I" indicator.
 *
 * Mounting this is what turns on the scroller's visibility tracking, so only
 * render it for threads that actually have somewhere to jump.
 */
export function MessageOutline({
  entries,
  className,
}: {
  entries: OutlineEntry[]
  className?: string
}) {
  const { scrollToMessage } = useMessageScroller()
  const { currentAnchorId } = useMessageScrollerVisibility()

  const ticks = useMemo(
    () => tickWindow(entries, currentAnchorId),
    [entries, currentAnchorId],
  )

  return (
    <HoverCard openDelay={100} closeDelay={150}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label="Jump to a question"
          className={cn(
            "flex flex-col items-center justify-center gap-[3px] rounded-md p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            className,
          )}
        >
          {ticks.map((entry) => (
            <span
              key={entry.id}
              data-current={entry.id === currentAnchorId}
              className="h-0.5 w-4 rounded-full bg-muted-foreground/40 transition-colors data-[current=true]:bg-foreground"
            />
          ))}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="left"
        align="center"
        sideOffset={-28}
        className="flex max-h-80 w-64 flex-col gap-1 overflow-y-auto rounded-2xl p-1"
      >
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-current={currentAnchorId === entry.id ? "location" : undefined}
            onClick={() =>
              scrollToMessage(entry.id, { align: "start", behavior: "smooth" })
            }
            className="flex min-h-7 shrink-0 items-center rounded-xl px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground aria-[current=location]:bg-accent aria-[current=location]:text-accent-foreground"
          >
            <span className="line-clamp-1 min-w-0">{entry.label}</span>
          </button>
        ))}
      </HoverCardContent>
    </HoverCard>
  )
}

// Keeps the highlighted tick on the rail by centering the window on wherever
// the reader is. currentAnchorId is null until they've scrolled past the first
// question, so fall back to the newest ones.
function tickWindow(entries: OutlineEntry[], currentAnchorId: string | null) {
  if (entries.length <= MAX_TICKS) return entries
  const last = entries.length - MAX_TICKS
  const current = entries.findIndex((e) => e.id === currentAnchorId)
  const start =
    current < 0
      ? last
      : Math.min(Math.max(current - Math.floor(MAX_TICKS / 2), 0), last)
  return entries.slice(start, start + MAX_TICKS)
}
