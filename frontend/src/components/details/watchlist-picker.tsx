"use client"

import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronsUpDown, Loader2, Plus } from "lucide-react"
import { InlineNameInput } from "@/components/watchlist/inline-name-input"
import {
  fetchWatchlistsForSymbol,
  addWatchlistItem,
  removeWatchlistItem,
  createWatchlist,
} from "@/actions/watchlist"
import type { WatchlistInfo } from "@/types/watchlist"

export function WatchlistPicker({
  symbol,
  onFollowingChange,
}: {
  symbol: string
  onFollowingChange: (following: boolean) => void
}) {
  const [watchlists, setWatchlists] = useState<WatchlistInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchWatchlistsForSymbol(symbol)
      .then(setWatchlists)
      .finally(() => setLoading(false))
  }, [symbol])

  async function handleToggle(watchlistId: number, currentlyHas: boolean) {
    const setContains = (value: boolean) =>
      setWatchlists((prev) =>
        prev.map((w) => (w.id === watchlistId ? { ...w, containsSymbol: value } : w))
      )

    setContains(!currentlyHas)
    try {
      // Two methods on one member URL rather than one call with an `add` flag,
      // so the optimistic state above and the request say the same thing.
      await (currentlyHas
        ? removeWatchlistItem(watchlistId, symbol)
        : addWatchlistItem(watchlistId, symbol))
    } catch {
      // Put the checkbox back. handleOpenChange reads this same array to tell
      // the parent whether the symbol is still followed, so leaving a failed
      // write flipped would propagate the wrong state to FollowButton too.
      setContains(currentlyHas)
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      const stillFollowing = watchlists.some((w) => w.containsSymbol)
      onFollowingChange(stillFollowing)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm" className="h-7 gap-1 text-xs">
          <ChevronsUpDown className="size-4" />
          Following
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Add to watchlist</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          watchlists.map((w) => (
            <DropdownMenuCheckboxItem
              key={w.id}
              checked={w.containsSymbol ?? false}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => handleToggle(w.id, w.containsSymbol ?? false)}
            >
              {w.name}
            </DropdownMenuCheckboxItem>
          ))
        )}
        <DropdownMenuSeparator />
        {isCreating ? (
          <div className="px-1 py-1" onKeyDown={(e) => e.stopPropagation()}>
            <InlineNameInput
              placeholder="Watchlist name"
              onSave={async (name) => {
                const created = await createWatchlist(name)
                setWatchlists((prev) => [...prev, { id: created.id, name: created.name, itemCount: 0, containsSymbol: false }])
                setIsCreating(false)
              }}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        ) : (
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setIsCreating(true) }}>
            <Plus className="size-4" />
            New watchlist
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
