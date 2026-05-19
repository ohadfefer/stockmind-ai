"use client"

import { useState, useMemo, useEffect } from "react"
import { History } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatDate, formatMoney, formatPrice } from "@/lib/format"
import type { HistoryEntry } from "@/services/account/account-service"

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

interface AccountHistoryProps {
  entries: HistoryEntry[]
}

export function AccountHistory({ entries }: AccountHistoryProps) {
  const years = useMemo(() => {
    const set = new Set(entries.map((e) => new Date(e.date).getFullYear()))
    return Array.from(set).sort()
  }, [entries])

  const [selectedYear, setSelectedYear] = useState(
    () => years[years.length - 1] || new Date().getFullYear()
  )

  const yearEntries = useMemo(
    () => entries.filter((e) => new Date(e.date).getFullYear() === selectedYear),
    [entries, selectedYear]
  )

  const months = useMemo(() => {
    const set = new Set(yearEntries.map((e) => new Date(e.date).getMonth()))
    return Array.from(set).sort()
  }, [yearEntries])

  const [selectedMonth, setSelectedMonth] = useState(
    () => months[months.length - 1] ?? new Date().getMonth()
  )

  useEffect(() => {
    if (months.length > 0 && !months.includes(selectedMonth)) {
      setSelectedMonth(months[months.length - 1])
    }
  }, [months, selectedMonth])

  const monthEntries = useMemo(
    () => yearEntries.filter((e) => new Date(e.date).getMonth() === selectedMonth),
    [yearEntries, selectedMonth]
  )

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
        <History className="mb-3 size-8 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">No History Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your account history will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Year tabs */}
      <div className="flex gap-2">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={cn(
              "px-3 py-1 text-sm font-medium rounded border transition-colors",
              selectedYear === y
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            )}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Month tabs */}
      <div className="flex gap-2">
        {months.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={cn(
              "px-3 py-1 text-sm font-medium rounded transition-colors",
              selectedMonth === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {MONTH_SHORT[m]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border text-center">
              <TableHead className="w-[120px] px-4 py-3 font-medium" />
              <TableHead className="px-4 py-3 font-medium">Date</TableHead>
              <TableHead className="px-4 py-3 font-medium">Action</TableHead>
              <TableHead className="px-4 py-3 font-medium text-right">Qty</TableHead>
              <TableHead className="px-4 py-3 font-medium">Symbol</TableHead>
              <TableHead className="px-4 py-3 font-medium text-right">Price</TableHead>
              <TableHead className="px-4 py-3 font-medium text-right">P&L</TableHead>
              <TableHead className="px-4 py-3 font-medium text-right">Principal</TableHead>
              <TableHead className="px-4 py-3 font-medium text-right">Commission</TableHead>
              <TableHead className="px-4 py-3 font-medium text-right">Fees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Month group header */}
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableCell colSpan={10} className="px-4 py-2 font-semibold text-foreground">
                {MONTH_FULL[selectedMonth]}
              </TableCell>
            </TableRow>

            {monthEntries.map((entry, i) => (
              <TableRow
                key={i}
                className={cn(
                  "border-b border-border last:border-0",
                  entry.type === "cash_update" && "bg-muted/20"
                )}
              >
                <TableCell className="px-4 py-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                      entry.type === "trade"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-yellow-500/10 text-yellow-500"
                    )}
                  >
                    {entry.type === "trade" ? "Trade" : "Cash Update"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-2.5 text-muted-foreground">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell className="px-4 py-2.5">
                  {entry.action && (
                    <span
                      className={cn(
                        entry.action === "buy" ? "text-green-500" : "text-red-500"
                      )}
                    >
                      {entry.action === "buy" ? "Buy" : "Sell"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right font-mono">
                  {entry.quantity ?? ""}
                </TableCell>
                <TableCell className="px-4 py-2.5 font-mono font-semibold">
                  {entry.symbol ?? ""}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right font-mono">
                  {entry.price != null ? formatPrice(entry.price) : ""}
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 py-2.5 text-right font-mono",
                    entry.pnl != null && entry.pnl < 0 && "text-red-500",
                    entry.pnl != null && entry.pnl >= 0 && "text-green-500"
                  )}
                >
                  {entry.type === "trade"
                    ? entry.pnl != null
                      ? formatMoney(entry.pnl)
                      : "—"
                    : ""}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right font-mono font-semibold">
                  {entry.type === "cash_update"
                    ? `$ ${formatMoney(entry.principal)}`
                    : formatMoney(entry.principal)}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right font-mono">
                  {entry.commission != null ? formatMoney(entry.commission) : ""}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-right font-mono">
                  {entry.fees != null ? formatMoney(entry.fees) : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
