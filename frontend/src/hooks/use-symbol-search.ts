import { useEffect, useState } from "react"

import { streamSymbolSearch } from "@/actions/stock-data"
import type { SymbolQuote, SymbolSearchMatch } from "@/services/stock/search-service"

export interface SymbolSearchResult extends SymbolSearchMatch {
  /**
   * Settles when this symbol's quote arrives, null when it has no price.
   * Never rejects, so a row can use() it under a Suspense boundary (as the
   * dashboard sections do with their promises) without an error boundary.
   */
  quote: Promise<SymbolQuote | null>
}

/**
 * Debounced ticker search against /api/stocks/search, which answers at most
 * 5 matches. The matches render as soon as they arrive; each row's quote is a
 * promise that settles when its line of the stream does. Owns only the query
 * + results; presentation (inline dropdown vs. mobile overlay) is left to the
 * caller.
 */
export function useSymbolSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SymbolSearchResult[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      // Resolvers for the quotes still in flight, by symbol.
      const pending = new Map<string, (quote: SymbolQuote | null) => void>()
      let gotMatches = false
      try {
        for await (const event of streamSymbolSearch(query, { signal: controller.signal })) {
          if (event.type === "matches") {
            gotMatches = true
            setResults(
              event.matches.map((match) => ({
                ...match,
                quote: new Promise((resolve) => pending.set(match.symbol, resolve)),
              })),
            )
          } else {
            pending.get(event.symbol)?.(event.quote)
            pending.delete(event.symbol)
          }
        }
      } catch {
        // An aborted request is the next keystroke arriving, not a failure —
        // leave the current results up rather than blanking the dropdown
        // between characters. A stream that breaks after the matches keeps
        // them too; only their missing prices are lost.
        if (!controller.signal.aborted && !gotMatches) setResults([])
      } finally {
        // Rows whose quote never arrived settle as unpriced rather than
        // showing a skeleton forever. Not on abort: those rows are about to
        // be replaced, and settling them would flash them unpriced first.
        if (!controller.signal.aborted) {
          for (const resolve of pending.values()) resolve(null)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  return { query, setQuery, results }
}
