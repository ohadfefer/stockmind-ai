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
  fetchWatchlists,
  toggleWatchlistItem,
  createWatchlist,
  type WatchlistEntry,
} from "@/actions/watchlist"

export function WatchlistPicker({
  symbol,
  onFollowingChange,
}: {
  symbol: string
  onFollowingChange: (following: boolean) => void
}) {
  const [watchlists, setWatchlists] = useState<WatchlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchWatchlists(symbol)
      .then(setWatchlists)
      .finally(() => setLoading(false))
  }, [symbol])

  async function handleToggle(watchlistId: number, currentlyHas: boolean) {
    setWatchlists((prev) =>
      prev.map((w) =>
        w.id === watchlistId ? { ...w, hasSymbol: !currentlyHas } : w
      )
    )
    await toggleWatchlistItem(watchlistId, symbol, !currentlyHas)
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) {
      const stillFollowing = watchlists.some((w) => w.hasSymbol)
      onFollowingChange(stillFollowing)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="sm">
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
              checked={w.hasSymbol}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => handleToggle(w.id, w.hasSymbol)}
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
                setWatchlists((prev) => [...prev, { id: created.id, name: created.name, hasSymbol: false }])
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
