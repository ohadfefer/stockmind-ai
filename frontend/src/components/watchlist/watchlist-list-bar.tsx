"use client"

import { useState } from "react"
import { List, Plus } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { InlineNameInput } from "@/components/watchlist/inline-name-input"
import type { WatchlistInfo } from "@/types/watchlist"

export function WatchlistListBar({ watchlists }: { watchlists: WatchlistInfo[] }) {
  const searchParams = useSearchParams()
  const activeId = searchParams.get("id")
  const activeWatchlistId = activeId ? Number(activeId) : watchlists[0]?.id
  const [isCreating, setIsCreating] = useState(false)

  return (
    <div className="flex items-center gap-1 border-b">
      {watchlists.map((wl) => {
        const isActive = wl.id === activeWatchlistId
        return (
          <Link
            key={wl.id}
            href={`/watchlist?id=${wl.id}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="size-4" />
            {wl.name}
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {wl.stockCount}
            </span>
          </Link>
        )
      })}
      {isCreating ? (
        <InlineNameInput
          placeholder="Watchlist name"
          onSave={(name) => {
            // TODO: call backend to create watchlist
            console.log("Create watchlist:", name)
            setIsCreating(false)
          }}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="size-4" />
          New watchlist
        </button>
      )}
    </div>
  )
}
