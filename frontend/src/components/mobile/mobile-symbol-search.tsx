"use client"

import { Search, X } from "lucide-react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSymbolSearch } from "@/hooks/use-symbol-search"

interface MobileSymbolSearchProps {
  navigateTo?: string
}

/**
 * Mobile counterpart to <SymbolSearch>: a header icon button that opens a
 * bottom-sheet search overlay (input + results list). Hidden from md up,
 * where the inline <SymbolSearch> takes over.
 */
export function MobileSymbolSearch({ navigateTo = "/details" }: MobileSymbolSearchProps) {
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, isLoading } = useSymbolSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setQuery("")
  }

  function selectSymbol(symbol: string) {
    setOpen(false)
    setQuery("")
    router.push(`${navigateTo}/${symbol}`)
  }

  const showEmpty = !isLoading && query.trim().length > 0 && results.length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          aria-label="Search securities"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary md:hidden"
        >
          <Search className="size-[18px]" />
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          inputRef.current?.focus()
        }}
        className="inset-x-0 bottom-0 top-auto flex h-[60dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:max-w-none"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3 text-left">
          <DialogTitle className="text-base font-semibold">Search</DialogTitle>
          <DialogClose className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <DialogDescription className="sr-only">
          Search for a stock by symbol or company name.
        </DialogDescription>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Search for a security
          </span>

          <div className="relative shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Symbol or name (e.g. SPY, Apple)"
              className="h-11 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Only the results scroll; the fixed-height sheet stays put. */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {isLoading && (
              <p className="px-1 py-2 text-sm text-muted-foreground">Searching…</p>
            )}
            {showEmpty && (
              <p className="px-1 py-2 text-sm text-muted-foreground">
                No matches for “{query.trim()}”.
              </p>
            )}
            {!isLoading &&
              results.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => selectSymbol(item.symbol)}
                  className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary active:bg-secondary"
                >
                  <span className="font-mono text-sm font-bold text-foreground">
                    {item.displaySymbol}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
