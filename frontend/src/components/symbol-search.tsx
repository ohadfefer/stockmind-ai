"use client"

import { Search } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

interface SearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

interface SymbolSearchProps {
  navigateTo?: string
  placeholder?: string
  className?: string
}

export function SymbolSearch({
  navigateTo = "/details",
  placeholder = "Search tickers, news, or AI analysis...",
  className = "w-full max-w-lg",
}: SymbolSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        const items = (data.result || []).slice(0, 5)
        setResults(items)
        setIsOpen(items.length > 0)
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setResults([])
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

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
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
          ) : (
            results.map((item) => (
              <button
                key={item.symbol}
                className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-secondary first:rounded-t-lg last:rounded-b-lg"
                onClick={() => {
                  setQuery("")
                  setIsOpen(false)
                  router.push(`${navigateTo}/${item.symbol}`)
                }}
              >
                <span className="text-sm font-medium text-foreground">{item.description}</span>
                <span className="text-xs text-muted-foreground">{item.displaySymbol}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
