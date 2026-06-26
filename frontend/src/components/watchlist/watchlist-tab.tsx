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
import { ArrowDown, ArrowUp } from "lucide-react"
import { ConfirmDelete } from "@/components/ui/confirm-delete"
import {
  SortableHeader,
  SortIcon,
  type SortDirection,
} from "@/components/ui/sortable-header"
import { useDetailsNavigation } from "@/components/navigation-loader"
import { deleteStock } from "@/actions/watchlist"
import { cn } from "@/lib/utils"

import type { WatchlistStockData } from "@/types/watchlist"

type SortColumn = "ticker" | "price" | "changeDollar" | "changePercent"

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

export function WatchlistTabSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card">
      <div className="flex items-center gap-6 border-b border-border px-5 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 w-20 rounded bg-secondary" />
        ))}
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 w-full rounded bg-secondary" />
        ))}
      </div>
    </div>
  )
}

interface WatchlistTabProps {
  stocks: WatchlistStockData[]
  watchlistId?: number
}

export function WatchlistTab({ stocks, watchlistId }: WatchlistTabProps) {
  const router = useRouter()
  const goToDetails = useDetailsNavigation()
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
    <>
      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="pl-5">
              <SortableHeader
                column="ticker"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              >
                Ticker
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader
                column="price"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              >
                Price
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader
                column="changeDollar"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              >
                Change $
              </SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader
                column="changePercent"
                activeColumn={sortColumn}
                direction={sortDirection}
                onSort={handleSort}
              >
                Change %
              </SortableHeader>
            </TableHead>
            {/* <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Market Cap
            </TableHead> */}
            <TableHead className="w-[170px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Day Range
            </TableHead>
            <TableHead className="w-[88px] pr-5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStocks.map((stock) => {
            const positive = stock.changePercent >= 0
            return (
              <TableRow
                key={stock.ticker}
                className="group cursor-pointer border-border transition-colors hover:bg-secondary/40"
                onClick={() => goToDetails(stock.ticker)}
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
                <TableCell className="w-[170px]">
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
                <TableCell className="w-[88px] pr-5">
                  <ConfirmDelete
                    onDelete={() => handleDelete(stock.ticker)}
                    confirming={confirmingTicker === stock.ticker}
                    onConfirmingChange={(v) => setConfirmingTicker(v ? stock.ticker : null)}
                    className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>

      {/* Mobile table — compact, no card wrapper. */}
      {/*
        Mobile table. Sticky-left Symbol column with horizontal scroll on the
        rest; the symbol stays anchored while the user swipes through the
        numeric columns (Price → % Change → Open → High → Low).
      */}
      <div className="overflow-x-auto overscroll-x-contain md:hidden">
        <div className="min-w-[640px]">
          <div className="flex items-center border-b border-border py-2.5 text-[11px] font-medium text-muted-foreground">
            <button
              type="button"
              className="sticky left-0 z-10 inline-flex w-[7.5rem] shrink-0 items-center gap-1 bg-background pl-1 pr-2 text-left"
              onClick={() => handleSort("ticker")}
            >
              Symbol
              <SortIcon
                column="ticker"
                activeColumn={sortColumn}
                direction={sortDirection}
              />
            </button>
            {(
              [
                { col: "price", label: "Price", sortable: true },
                { col: "changeDollar", label: "Change", sortable: true },
                { col: "changePercent", label: "% Change", sortable: true },
                { col: "open", label: "Open", sortable: false },
                { col: "high", label: "High", sortable: false },
                { col: "low", label: "Low", sortable: false },
              ] as const
            ).map(({ col, label, sortable }) =>
              sortable ? (
                <button
                  key={col}
                  type="button"
                  className="inline-flex w-[5.5rem] shrink-0 items-center justify-end gap-1 px-2"
                  onClick={() => handleSort(col as SortColumn)}
                >
                  {label}
                  <SortIcon
                    column={col as SortColumn}
                    activeColumn={sortColumn}
                    direction={sortDirection}
                  />
                </button>
              ) : (
                <span
                  key={col}
                  className="inline-flex w-[5.5rem] shrink-0 justify-end px-2"
                >
                  {label}
                </span>
              ),
            )}
          </div>
          {sortedStocks.map((stock) => {
            const isZero = stock.changePercent === 0
            const positive = stock.changePercent > 0
            const changeColor = isZero
              ? "text-muted-foreground"
              : positive
                ? "text-[#10B981]"
                : "text-[#EF4444]"
            return (
              <div
                key={stock.ticker}
                role="button"
                tabIndex={0}
                className="group flex w-full cursor-pointer items-center border-b border-border py-3 text-left transition-colors active:bg-secondary/40"
                onClick={() => goToDetails(stock.ticker)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    goToDetails(stock.ticker)
                  }
                }}
              >
                {/*
                  Sticky cell must paint a solid background so it isn't see-through
                  while the user scrolls the row horizontally. On active we mix the
                  same 40% secondary into background so the press tint visually
                  extends through the sticky column.
                */}
                <div className="sticky left-0 z-10 w-[7.5rem] shrink-0 bg-background pl-1 pr-2 group-active:bg-[color-mix(in_oklab,var(--background),var(--secondary)_40%)]">
                  <span className="block font-mono text-xs font-bold text-foreground">
                    {stock.ticker}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {stock.company}
                  </span>
                </div>
                <div className="w-[5.5rem] shrink-0 px-2 text-right font-mono text-xs tabular-nums text-foreground">
                  {stock.price.toFixed(2)}
                </div>
                <div
                  className={cn(
                    "flex w-[5.5rem] shrink-0 items-center justify-end gap-1 px-2 font-mono text-xs font-semibold tabular-nums",
                    changeColor,
                  )}
                >
                  <span>
                    {positive ? "+" : ""}
                    {stock.changeDollar.toFixed(2)}
                  </span>
                  {!isZero &&
                    (positive ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    ))}
                </div>
                <div
                  className={cn(
                    "flex w-[5.5rem] shrink-0 items-center justify-end gap-1 px-2 font-mono text-xs font-semibold tabular-nums",
                    changeColor,
                  )}
                >
                  <span>
                    {positive ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                  {!isZero &&
                    (positive ? (
                      <ArrowUp className="size-3" />
                    ) : (
                      <ArrowDown className="size-3" />
                    ))}
                </div>
                <div className="w-[5.5rem] shrink-0 px-2 text-right font-mono text-xs tabular-nums text-foreground">
                  {stock.open != null ? stock.open.toFixed(2) : "—"}
                </div>
                <div className="w-[5.5rem] shrink-0 px-2 text-right font-mono text-xs tabular-nums text-foreground">
                  {stock.dayHigh != null ? stock.dayHigh.toFixed(2) : "—"}
                </div>
                <div className="w-[5.5rem] shrink-0 px-2 text-right font-mono text-xs tabular-nums text-foreground">
                  {stock.dayLow != null ? stock.dayLow.toFixed(2) : "—"}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
