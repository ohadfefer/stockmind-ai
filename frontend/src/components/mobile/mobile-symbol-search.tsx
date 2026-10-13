"use client"

import { Search } from "lucide-react"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useSymbolSearch } from "@/hooks/use-symbol-search"
import { useVisualViewport } from "@/hooks/use-visual-viewport"
import { useNavigationLoader } from "@/components/navigation-loader"
import { SymbolSearchResults } from "@/components/symbol-search-results"

interface MobileSymbolSearchProps {
  navigateTo?: string
}

// Gap between the card and the keyboard (or the screen's bottom edge), and
// between the card and the top of the visible area when it grows that tall.
const CARD_MARGIN_PX = 12

/**
 * Mobile counterpart to <SymbolSearch>: a header icon button that opens a
 * floating search card sitting on the keyboard, results stacked above the
 * input so the card grows upward as they arrive. Hidden from md up, where
 * the inline <SymbolSearch> takes over.
 */
export function MobileSymbolSearch({ navigateTo = "/details" }: MobileSymbolSearchProps) {
  const [open, setOpen] = useState(false)
  const { query, setQuery, results } = useSymbolSearch(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const viewport = useVisualViewport(open)
  const router = useRouter()
  const { startLoading } = useNavigationLoader()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setQuery("")
  }

  // iOS raises the keyboard only for a focus() made while the tap is still
  // being handled. Radix's own autofocus runs from an effect after the dialog
  // mounts, which isn't guaranteed to happen inside the tap, so the dialog is
  // mounted synchronously here and the input focused in the same handler.
  // preventDefault stops the trigger's built-in toggle from running after.
  function openAndFocus(e: React.MouseEvent) {
    e.preventDefault()
    flushSync(() => setOpen(true))
    inputRef.current?.focus()
  }

  function selectSymbol(symbol: string) {
    setOpen(false)
    setQuery("")
    if (navigateTo.startsWith("/details")) startLoading()
    router.push(`${navigateTo}/${symbol}`)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          aria-label="Search securities"
          onClick={openAndFocus}
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
        // Pinned to the visible area's bottom edge rather than the layout
        // viewport's, which the iOS keyboard covers. Without visualViewport
        // the classes below place it at the screen's bottom instead.
        style={
          viewport
            ? {
                bottom: viewport.bottom + CARD_MARGIN_PX,
                maxHeight: viewport.height - 2 * CARD_MARGIN_PX,
              }
            : undefined
        }
        className="inset-x-3 bottom-3 top-auto flex max-h-[85dvh] w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-3xl bg-card p-0 transition-[bottom] sm:max-w-none"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search for a stock by symbol or company name.
        </DialogDescription>

        {/* Only the results scroll; the input stays pinned at the bottom. */}
        {results.length > 0 && (
          <div className="min-h-0 overflow-y-auto overscroll-contain border-b border-border">
            <SymbolSearchResults
              results={results}
              onSelect={selectSymbol}
              className="rounded-none border-0 bg-transparent"
            />
          </div>
        )}

        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Symbol or name (e.g. SPY, Apple)"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="search"
            enterKeyHint="search"
            className="h-16 w-full bg-transparent pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
