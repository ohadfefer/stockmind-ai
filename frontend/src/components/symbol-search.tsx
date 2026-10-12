"use client"

import { Search } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSymbolSearch } from "@/hooks/use-symbol-search"
import { useNavigationLoader } from "@/components/navigation-loader"
import { SymbolSearchResults } from "@/components/symbol-search-results"

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
  const { query, setQuery, results } = useSymbolSearch()
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
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
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
        className="h-9 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
      />
      {isOpen && (
        <SymbolSearchResults
          results={results}
          onSelect={(symbol) => {
            setQuery("")
            setIsOpen(false)
            if (navigateTo.startsWith("/details")) startLoading()
            router.push(`${navigateTo}/${symbol}`)
          }}
          className="absolute left-0 top-full z-50 mt-1 w-full shadow-lg"
        />
      )}
    </div>
  )
}
