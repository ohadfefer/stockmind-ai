"use client"

import { Search, Bell } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import clsx from "clsx"

interface SearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

export function Header() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchMarketStatus() {
      try {
        const res = await fetch("/api/market/status")
        const data = await res.json()
        setMarketOpen(data.isOpen)
      } catch {
        setMarketOpen(null)
      }
    }
    fetchMarketStatus()
    const interval = setInterval(fetchMarketStatus, 60000)
    return () => clearInterval(interval)
  }, [])

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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-lg" ref={dropdownRef}>
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Search tickers, news, or AI analysis..."
            className="h-9 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {isOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
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
                      router.push(`/details/${item.symbol}`)
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
      </div>

      <div className="flex items-center gap-4">
        <div className={clsx(
          "flex items-center gap-2 rounded-full border px-3 py-1",
          marketOpen === null && "border-muted-foreground/30 bg-muted-foreground/10",
          marketOpen === true && "border-[#10B981]/30 bg-[#10B981]/10",
          marketOpen === false && "border-[#EF4444]/30 bg-[#EF4444]/10",
        )}>
          <span className={clsx(
            "size-2 rounded-full",
            marketOpen === null && "bg-muted-foreground",
            marketOpen === true && "bg-[#10B981] animate-pulse",
            marketOpen === false && "bg-[#EF4444]",
          )} />
          <span className={clsx(
            "text-xs font-semibold tracking-wide uppercase",
            marketOpen === null && "text-muted-foreground",
            marketOpen === true && "text-[#10B981]",
            marketOpen === false && "text-[#EF4444]",
          )}>
            {marketOpen === null ? "Loading..." : marketOpen ? "Market Open" : "Market Closed"}
          </span>
        </div>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="size-[18px]" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  )
}
