"use client"

import { Bell, BellOff, BellRing } from "lucide-react"
import { useState, useEffect } from "react"
import clsx from "clsx"
import { SymbolSearch } from "@/components/symbol-search"
import { useNotifications } from "@/hooks/use-notifications"

export function Header() {
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null)
  const { status: notifStatus, subscribe } = useNotifications()

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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-1 items-center justify-center">
        <SymbolSearch />
      </div>

      <div className="flex items-center gap-4">
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
        <button
          onClick={notifStatus === "prompt" ? subscribe : undefined}
          title={
            notifStatus === "subscribed" ? "Notifications enabled" :
            notifStatus === "denied" ? "Notifications blocked — enable in browser settings" :
            notifStatus === "prompt" ? "Enable notifications" :
            "Notifications"
          }
          className={clsx(
            "relative rounded-lg p-2 transition-colors",
            notifStatus === "subscribed"
              ? "text-primary hover:bg-secondary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            notifStatus === "prompt" && "cursor-pointer",
            notifStatus === "denied" && "cursor-not-allowed opacity-50",
          )}
        >
          {notifStatus === "denied" ? (
            <BellOff className="size-[18px]" />
          ) : notifStatus === "subscribed" ? (
            <BellRing className="size-[18px]" />
          ) : (
            <Bell className="size-[18px]" />
          )}
          {notifStatus === "prompt" && (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
          )}
        </button>
      </div>
    </header>
  )
}
