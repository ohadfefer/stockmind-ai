"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { ConfirmDelete } from "@/components/ui/confirm-delete"
import { deleteStock } from "@/actions/watchlist"

import type { WatchlistStockData } from "@/types/watchlist"

type SortColumn = "ticker" | "price" | "changeDollar" | "changePercent"
type SortDirection = "asc" | "desc" | "default"

function SortIcon({
  column,
  activeColumn,
  direction,
}: {
  column: SortColumn
  activeColumn: SortColumn | null
  direction: SortDirection
}) {
  if (activeColumn !== column || direction === "default")
    return <ArrowUpDown className="size-3 opacity-50" />
  if (direction === "asc") return <ArrowUp className="size-3" />
  return <ArrowDown className="size-3" />
}

function getAIScoreColor(score: number): string {
  if (score >= 8) return "bg-[#10B981] text-[#FFFFFF]"
  if (score >= 6) return "bg-[#F59E0B] text-[#0A0B0D]"
  return "bg-[#EF4444] text-[#FFFFFF]"
}

function RangeBar({
  low,
  high,
  current,
}: {
  low: number
  high: number
  current: number
}) {
  const range = high - low
  const position = range > 0 ? ((current - low) / range) * 100 : 50
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] text-muted-foreground">
        {low.toFixed(0)}
      </span>
      <div className="relative h-1.5 w-20 rounded-full bg-secondary">
        <div
          className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `calc(${Math.min(Math.max(position, 0), 100)}% - 5px)` }}
        />
      </div>
      <span className="font-mono text-[11px] text-muted-foreground">
        {high.toFixed(0)}
      </span>
    </div>
  )
}

interface WatchlistTabProps {
  stocks: WatchlistStockData[]
  watchlistId?: number
}

export function WatchlistTab({ stocks, watchlistId }: WatchlistTabProps) {
  const router = useRouter()
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("default")
  const [confirmingTicker, setConfirmingTicker] = useState<string | null>(null)
  const [removedTickers, setRemovedTickers] = useState<Set<string>>(new Set())

  useEffect(() => {
    setRemovedTickers(new Set())
    setConfirmingTicker(null)
  }, [watchlistId, stocks])

  function handleSort(column: SortColumn) {
    if (sortColumn !== column) {
      setSortColumn(column)
      setSortDirection("asc")
    } else if (sortDirection === "asc") {
      setSortDirection("desc")
    } else {
      setSortDirection("default")
      setSortColumn(null)
    }
  }

  async function handleDelete(ticker: string) {
    setRemovedTickers((prev) => new Set(prev).add(ticker))
    try {
      await deleteStock(ticker, watchlistId)
      router.refresh()
    } catch {
      setRemovedTickers((prev) => {
        const next = new Set(prev)
        next.delete(ticker)
        return next
      })
    }
  }

  const sortedStocks = useMemo(() => {
    const filtered = stocks.filter((s) => !removedTickers.has(s.ticker))
    if (!sortColumn || sortDirection === "default") return filtered
    return [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortColumn) {
        case "ticker":
          cmp = a.ticker.localeCompare(b.ticker)
          break
        case "price":
          cmp = a.price - b.price
          break
        case "changeDollar":
          cmp = a.changeDollar - b.changeDollar
          break
        case "changePercent":
          cmp = a.changePercent - b.changePercent
          break
      }
      return sortDirection === "desc" ? -cmp : cmp
    })
  }, [stocks, sortColumn, sortDirection, removedTickers])

  if (sortedStocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <p className="text-lg font-semibold text-foreground">
          No stocks in your watchlist
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow stocks from their detail page to add them here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-5">
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleSort("ticker")}
              >
                Ticker
                <SortIcon column="ticker" activeColumn={sortColumn} direction={sortDirection} />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleSort("price")}
              >
                Price
                <SortIcon column="price" activeColumn={sortColumn} direction={sortDirection} />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleSort("changeDollar")}
              >
                Change $
                <SortIcon column="changeDollar" activeColumn={sortColumn} direction={sortDirection} />
              </button>
            </TableHead>
            <TableHead>
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => handleSort("changePercent")}
              >
                Change %
                <SortIcon column="changePercent" activeColumn={sortColumn} direction={sortDirection} />
              </button>
            </TableHead>
            {/* <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Market Cap
            </TableHead> */}
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Day Range
            </TableHead>
            <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              AI Score
            </TableHead>
            <TableHead className="pr-5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStocks.map((stock) => {
            const positive = stock.changePercent >= 0
            return (
              <TableRow
                key={stock.ticker}
                className="group cursor-pointer border-border transition-colors hover:bg-secondary/40"
                onClick={() => router.push(`/details/${stock.ticker}`)}
              >
                <TableCell className="pl-5">
                  <div>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {stock.ticker}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {stock.company}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-foreground">
                  ${stock.price.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`font-mono text-sm font-semibold ${positive ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                >
                  {positive ? "+" : ""}${stock.changeDollar.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`font-mono text-sm font-semibold ${positive ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                >
                  {positive ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </TableCell>
                {/* <TableCell className="font-mono text-sm text-muted-foreground">
                  {stock.marketCap ?? "—"}
                </TableCell> */}
                <TableCell>
                  {stock.dayLow != null && stock.dayHigh != null ? (
                    <RangeBar
                      low={stock.dayLow}
                      high={stock.dayHigh}
                      current={stock.price}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {stock.aiScore != null ? (
                    <span
                      className={`inline-flex size-8 items-center justify-center rounded-lg font-mono text-xs font-bold ${getAIScoreColor(
                        stock.aiScore
                      )}`}
                    >
                      {stock.aiScore}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="pr-5">
                  <ConfirmDelete
                    onDelete={() => handleDelete(stock.ticker)}
                    confirming={confirmingTicker === stock.ticker}
                    onConfirmingChange={(v) => setConfirmingTicker(v ? stock.ticker : null)}
                    className="opacity-0 group-hover:opacity-100"
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
