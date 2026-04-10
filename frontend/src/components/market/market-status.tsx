"use client"

import { useState, useEffect } from "react"
import clsx from "clsx"

export function MarketStatus() {
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null)

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

  return (
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
  )
}
