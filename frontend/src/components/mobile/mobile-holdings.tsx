"use client"

import { useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MobileDataCard } from "@/components/mobile/mobile-data-card"
import { TickerLogo } from "@/components/portfolio/ticker-logo"
import { cn } from "@/lib/utils"
import type { Holding } from "@/services/portfolio/portfolio-service"

// The phone layout filters holdings (All / Gainers / Decliners) instead of
// sorting like the desktop table. The metric dropdown decides whether a holding
// counts as a gainer/decliner by its 1-day move or its total since-purchase P&L.
type Filter = "all" | "gainers" | "decliners"
type Metric = "day" | "purchase"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gainers", label: "Gainers" },
  { value: "decliners", label: "Decliners" },
]

interface MobileHoldingsProps {
  holdings: Holding[]
}

export function MobileHoldings({ holdings }: MobileHoldingsProps) {
  const [filter, setFilter] = useState<Filter>("all")
  const [metric, setMetric] = useState<Metric>("day")

  const visible = useMemo(() => {
    if (filter === "all") return holdings
    return holdings.filter((h) => {
      const change = metric === "day" ? h.dayChangeDollar : h.plDollar
      return filter === "gainers" ? change >= 0 : change < 0
    })
  }, [holdings, filter, metric])

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {/* All / Gainers / Decliners segmented control */}
      <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-md border border-border bg-card">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
            className={cn(
              "flex items-center justify-center px-2 py-1.5 text-[13px] font-medium transition-colors",
              filter === f.value
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Gainer/decliner basis: 1-day move vs. total since-purchase P&L */}
      <Select value={metric} onValueChange={(v) => setMetric(v as Metric)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">1 Day</SelectItem>
          <SelectItem value="purchase">Since purchase</SelectItem>
        </SelectContent>
      </Select>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {filter === "all" ? "No holdings found" : `No ${filter}`}
        </p>
      ) : (
        visible.map((h) => {
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
        })
      )}
    </div>
  )
}
