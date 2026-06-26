"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  SortableHeader,
  type SortDirection,
} from "@/components/ui/sortable-header"
import { MobileDataCard } from "@/components/mobile/mobile-data-card"
import { cn } from "@/lib/utils"
import type { Holding } from "@/services/portfolio/portfolio-service"

interface PortfolioHoldingsProps {
  holdings: Holding[]
}

// Sorting applies to the desktop table only; mobile cards keep document order.
type SortColumn = "totalValue" | "pl" | "dayChange"

export function PortfolioHoldings({ holdings }: PortfolioHoldingsProps) {
  const [query, setQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("default")

  const filteredHoldings = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return holdings
    return holdings.filter(
      (h) =>
        h.ticker.toLowerCase().includes(q) ||
        h.company.toLowerCase().includes(q),
    )
  }, [holdings, query])

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

  // Sorted view feeds the desktop table only; mobile cards use filteredHoldings.
  const sortedHoldings = useMemo(() => {
    if (!sortColumn || sortDirection === "default") return filteredHoldings
    return [...filteredHoldings].sort((a, b) => {
      let cmp = 0
      switch (sortColumn) {
        case "totalValue":
          cmp = a.totalValue - b.totalValue
          break
        case "pl":
          cmp = a.plDollar - b.plDollar
          break
        case "dayChange":
          cmp = a.dayChangeDollar - b.dayChangeDollar
          break
      }
      return sortDirection === "desc" ? -cmp : cmp
    })
  }, [filteredHoldings, sortColumn, sortDirection])

  return (
    <>
      <div className="relative w-full md:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search holdings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full border-x-0 border-t-0 border-b border-border bg-transparent py-2 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {filteredHoldings.length === 0 && query.trim() !== "" ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          No holdings found
        </p>
      ) : (
      <>
      {/* Desktop table. min-w-0 lets the inner overflow-x-auto actually scroll
          instead of pushing the page wider than the available column. */}
      <div className="hidden min-w-0 rounded-xl border border-border bg-card md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ticker
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Shares
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Avg Buy
                </TableHead>
                <TableHead>
                  <SortableHeader
                    column="totalValue"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Total Value
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    column="pl"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    {"P&L $ (%)"}
                  </SortableHeader>
                </TableHead>
                <TableHead>
                  <SortableHeader
                    column="dayChange"
                    activeColumn={sortColumn}
                    direction={sortDirection}
                    onSort={handleSort}
                  >
                    Day Change
                  </SortableHeader>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHoldings.map((h) => {
                const plPositive = h.plDollar >= 0
                const dayPositive = h.dayChangeDollar >= 0
                return (
                  <TableRow
                    key={h.ticker}
                    className="border-border transition-colors hover:bg-secondary/40"
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <TickerLogo logo={h.logo} ticker={h.ticker} />
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="font-mono text-sm font-bold text-primary">
                              {h.ticker}
                            </span>
                            <span className="font-mono text-xs text-muted-foreground">
                              ${h.currentPrice.toFixed(2)}
                            </span>
                          </div>
                          <p className="truncate text-sm font-medium text-foreground">
                            {h.company}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      {h.shares.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      ${h.avgBuy.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-foreground">
                      ${h.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div
                        className={`font-mono text-sm font-semibold ${
                          plPositive ? "text-[#10B981]" : "text-[#EF4444]"
                        }`}
                      >
                        {plPositive ? "+" : ""}${h.plDollar.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <br />
                        <span className="text-xs">
                          {plPositive ? "+" : ""}{h.plPercent.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`font-mono text-sm font-semibold ${
                          dayPositive ? "text-[#10B981]" : "text-[#EF4444]"
                        }`}
                      >
                        {dayPositive ? "+" : ""}${h.dayChangeDollar.toFixed(2)}
                        <br />
                        <span className="text-xs">
                          ({dayPositive ? "+" : ""}{h.dayChangePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile cards. */}
      <div className="flex flex-col gap-3 md:hidden">
        {filteredHoldings.map((h) => {
          const plPositive = h.plDollar >= 0
          const dayPositive = h.dayChangeDollar >= 0
          const plColor = plPositive ? "text-[#10B981]" : "text-[#EF4444]"
          const dayColor = dayPositive ? "text-[#10B981]" : "text-[#EF4444]"
          return (
            <MobileDataCard key={h.ticker}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <TickerLogo logo={h.logo} ticker={h.ticker} />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <p className="font-mono text-sm font-bold text-primary">
                        {h.ticker}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        ${h.currentPrice.toFixed(2)}
                      </p>
                    </div>
                    <p className="truncate text-sm font-medium text-foreground">
                      {h.company}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 font-mono text-base font-bold text-foreground">
                  ${h.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    P&L
                  </p>
                  <p className={cn("font-mono text-sm font-semibold", plColor)}>
                    {plPositive ? "+" : ""}${h.plDollar.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={cn("font-mono text-xs", plColor)}>
                    {plPositive ? "+" : ""}{h.plPercent.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Day
                  </p>
                  <p className={cn("font-mono text-sm font-semibold", dayColor)}>
                    {dayPositive ? "+" : ""}${h.dayChangeDollar.toFixed(2)}
                  </p>
                  <p className={cn("font-mono text-xs", dayColor)}>
                    ({dayPositive ? "+" : ""}{h.dayChangePercent.toFixed(2)}%)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Shares
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    {h.shares.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Avg Buy
                  </p>
                  <p className="font-mono text-sm text-foreground">
                    ${h.avgBuy.toFixed(2)}
                  </p>
                </div>
              </div>
            </MobileDataCard>
          )
        })}
      </div>
      </>
      )}
    </>
  )
}

function TickerLogo({ logo, ticker }: { logo?: string; ticker: string }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
      {logo ? (
        // Finnhub-hosted asset; using <img> avoids requiring each profile host
        // in next.config remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={ticker}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <span className="font-mono text-[10px] font-bold text-muted-foreground">
          {ticker.slice(0, 3)}
        </span>
      )}
    </div>
  )
}
