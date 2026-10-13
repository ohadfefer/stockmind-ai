"use client"

import { Search } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSymbolSearch } from "@/hooks/use-symbol-search"
import { useNavigationLoader } from "@/components/navigation-loader"
import { SymbolSearchResults } from "@/components/symbol-search-results"
import { cn } from "@/lib/utils"

interface SymbolSearchProps {
  navigateTo?: string
  placeholder?: string
  className?: string
  /** Price each match. Off for callers that only need the symbol, like news. */
  showQuotes?: boolean
}

export function SymbolSearch({
  navigateTo = "/details",
  placeholder = "Search tickers, news, or AI analysis...",
  className = "w-full max-w-lg",
  showQuotes = true,
}: SymbolSearchProps) {
  const { query, setQuery, results } = useSymbolSearch(showQuotes)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { startLoading } = useNavigationLoader()

  // Open the dropdown as soon as matches arrive; close it when they clear.
  useEffect(() => {
    setIsOpen(results.length > 0)
  }, [results])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    // The wrapper holds the input's slot in the layout; the card inside is
    // absolute, so it can stretch down over the page without moving anything.
    <div className={`relative h-9 ${className}`} ref={dropdownRef}>
      {/* Same card as <MobileSymbolSearch>, mirrored: the input is its top
          edge and the results stretch it downward. */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-50 flex flex-col overflow-hidden rounded-3xl border border-border bg-card",
          isOpen && "shadow-lg",
        )}
      >
        <div className="relative shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            // 34px plus the card's 1px borders fills the 36px slot exactly.
            className="h-[34px] w-full bg-transparent pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
        </div>
        {isOpen && (
          <div className="border-t border-border">
            <SymbolSearchResults
              results={results}
              onSelect={(symbol) => {
                setQuery("")
                setIsOpen(false)
                if (navigateTo.startsWith("/details")) startLoading()
                router.push(`${navigateTo}/${symbol}`)
              }}
              className="rounded-none border-0 bg-transparent"
            />
          </div>
        )}
      </div>
    </div>
  )
}
