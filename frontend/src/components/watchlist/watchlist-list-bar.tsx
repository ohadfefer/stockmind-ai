"use client"

import { useState } from "react"
import { List, Plus, EllipsisVertical, Pencil, Trash2, Check } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { TabBarShell } from "@/components/tab-bar-shell"
import { useNavigationLoader } from "@/components/navigation-loader"
import { InlineNameInput } from "@/components/watchlist/inline-name-input"
import {
  createWatchlist,
  renameWatchlist,
  deleteWatchlist,
} from "@/actions/watchlist"
import type { WatchlistInfo } from "@/types/watchlist"

export function WatchlistListBar({ watchlists }: { watchlists: WatchlistInfo[] }) {
  const router = useRouter()
  const { startLoading } = useNavigationLoader()
  const searchParams = useSearchParams()
  const activeId = searchParams.get("id")
  const activeWatchlistId = activeId ? Number(activeId) : watchlists[0]?.id
  const [isCreating, setIsCreating] = useState(false)
  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  async function handleRename(watchlistId: number, name: string) {
    await renameWatchlist(watchlistId, name)
    setRenamingId(null)
    router.refresh()
  }

  async function handleDelete(watchlistId: number) {
    if (confirmDeleteId !== watchlistId) {
      setConfirmDeleteId(watchlistId)
      return
    }
    setConfirmDeleteId(null)
    await deleteWatchlist(watchlistId)
    router.push("/watchlist")
    router.refresh()
  }

  return (
    <TabBarShell>
      {watchlists.map((wl) => {
        const isActive = wl.id === activeWatchlistId

        if (renamingId === wl.id) {
          return (
            <InlineNameInput
              key={wl.id}
              placeholder="Watchlist name"
              defaultValue={wl.name}
              onSave={(name) => handleRename(wl.id, name)}
              onCancel={() => setRenamingId(null)}
            />
          )
        }

        return (
          <div key={wl.id} className="flex shrink-0 items-center">
            <Link
              href={`/watchlist?id=${wl.id}`}
              // Switching lists is a real navigation — the server fetches
              // that list's quotes — so hold the current table under the
              // overlay instead of letting it go blank. Skipped for the
              // active tab (the URL wouldn't change, so nothing would
              // commit to hide it) and for modifier-clicks, which open a
              // new tab rather than navigating here.
              onClick={(e) => {
                if (isActive) return
                if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                  startLoading()
                }
              }}
              className={cn(
                "flex items-center gap-2 pl-4 pr-2 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px md:text-sm",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5 md:size-4" />
              {wl.name}
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {wl.itemCount}
              </span>
            </Link>
            {isActive && (
              <DropdownMenu>
                <DropdownMenuTrigger className="py-2.5 pr-2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                  <EllipsisVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" onCloseAutoFocus={() => setConfirmDeleteId(null)}>
                  <DropdownMenuItem onSelect={() => { setRenamingId(wl.id); setIsCreating(false) }}>
                    <Pencil className="size-4" />
                    Rename
                  </DropdownMenuItem>
                  {confirmDeleteId === wl.id ? (
                    <DropdownMenuItem onSelect={() => handleDelete(wl.id)}>
                      <Check className="size-4" />
                      Confirm delete?
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleDelete(wl.id) }}>
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )
      })}
      {isCreating ? (
        <InlineNameInput
          placeholder="Watchlist name"
          onSave={async (name) => {
            const { id } = await createWatchlist(name)
            setIsCreating(false)
            // Same navigation as a tab click, so same overlay. The id is
            // freshly created, so the URL always changes.
            startLoading()
            router.push(`/watchlist?id=${id}`)
            router.refresh()
          }}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <button
          onClick={() => { setIsCreating(true); setRenamingId(null) }}
          className="flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors md:text-sm"
        >
          <Plus className="size-4" />
          New watchlist
        </button>
      )}
    </TabBarShell>
  )
}
