"use client"

import { Suspense, use } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { SymbolSearchResult } from "@/hooks/use-symbol-search"
import type { SymbolQuote } from "@/services/stock/search-service"
import { formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"

interface SymbolSearchResultsProps {
  results: SymbolSearchResult[]
  onSelect: (symbol: string) => void
  className?: string
}

/**
 * The results list shared by the inline <SymbolSearch> dropdown and the
 * <MobileSymbolSearch> sheet, so both render identical rows: ticker over
 * company on the left, price over day change on the right. The matches show
 * immediately; each price shows a skeleton until its quote settles. Results
 * fetched without quotes render the left side only.
 */
export function SymbolSearchResults({ results, onSelect, className }: SymbolSearchResultsProps) {
  return (
    <div className={cn("divide-y divide-border rounded-lg border border-border bg-card", className)}>
      {results.map((item) => (
        <button
          key={item.symbol}
          onClick={() => onSelect(item.symbol)}
          className="flex w-full items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors hover:bg-secondary active:bg-secondary first:rounded-t-lg last:rounded-b-lg"
        >
          {/* Same line heights and gap as RowQuote, so a row is the same
              height whether its quote is loading, priced or missing. */}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-mono text-sm font-bold text-foreground">
              {item.displaySymbol}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {item.description}
            </span>
          </div>
          {/* One boundary per row, so each price lands as its own quote does. */}
          {item.quote && (
            <Suspense fallback={<QuoteSkeleton />}>
              <RowQuote quote={item.quote} />
            </Suspense>
          )}
        </button>
      ))}
    </div>
  )
}

function RowQuote({ quote }: { quote: Promise<SymbolQuote | null> }) {
  const resolved = use(quote)
  if (!resolved) return null

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span className="font-mono text-sm tabular-nums text-foreground">
        ${formatMoney(resolved.price)}
      </span>
      <ChangePercent value={resolved.changePercent} />
    </div>
  )
}

/** Sized to RowQuote's two lines, so the row doesn't shift when the price lands. */
function QuoteSkeleton() {
  return (
    <div className="flex shrink-0 animate-pulse flex-col items-end gap-0.5">
      <div className="my-1 h-3 w-16 rounded bg-secondary" />
      <div className="my-0.5 h-3 w-12 rounded bg-secondary" />
    </div>
  )
}

function ChangePercent({ value }: { value: number }) {
  // Sign and color follow the rounded figure, so a -0.004% move reads as a
  // neutral 0.00% rather than a red "-0.00%" with a down arrow.
  const rounded = Math.round(value * 100) / 100
  const positive = rounded > 0
  const negative = rounded < 0

  return (
    <span
      className={cn(
        "flex items-center gap-1 font-mono text-xs font-semibold tabular-nums",
        positive ? "text-[#10B981]" : negative ? "text-[#EF4444]" : "text-muted-foreground",
      )}
    >
      {positive ? "+" : negative ? "-" : ""}
      {Math.abs(rounded).toFixed(2)}%
      {(positive || negative) && (
        <span
          className={cn(
            "flex size-3.5 items-center justify-center rounded-full text-card",
            positive ? "bg-[#10B981]" : "bg-[#EF4444]",
          )}
        >
          {positive ? (
            <ArrowUp className="size-2.5" strokeWidth={3} />
          ) : (
            <ArrowDown className="size-2.5" strokeWidth={3} />
          )}
        </span>
      )}
    </span>
  )
}
