import { useEffect, useState } from "react"

export interface SymbolSearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

/**
 * Debounced ticker search against /api/stocks/search, capped at 5 matches.
 * Owns only the query + results; presentation (inline dropdown vs. mobile
 * overlay) is left to the caller.
 */
export function useSymbolSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SymbolSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
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
        setResults((data.result || []).slice(0, 5))
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

  return { query, setQuery, results, isLoading }
}
