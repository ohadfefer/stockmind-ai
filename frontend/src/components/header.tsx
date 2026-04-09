"use client"

import { Bell, BellOff, TrendingUp, TrendingDown } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import clsx from "clsx"
import { SymbolSearch } from "@/components/symbol-search"
import { useNotifications } from "@/hooks/use-notifications"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { fetchMissedAlerts, dismissMissedAlerts } from "@/actions/alerts"
import type { MissedAlert } from "@/services/alerts/missed-alerts-service"

export function Header() {
  const [marketOpen, setMarketOpen] = useState<boolean | null>(null)
  const { status: notifStatus } = useNotifications()
  const [missedAlerts, setMissedAlerts] = useState<MissedAlert[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)

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

  const loadMissedAlerts = useCallback(async () => {
    try {
      const alerts = await fetchMissedAlerts()
      setMissedAlerts(alerts)
    } catch {
      // ignore
    }
  }, [])

  // Poll missed alerts every 60s
  useEffect(() => {
    loadMissedAlerts()
    const interval = setInterval(loadMissedAlerts, 60000)
    return () => clearInterval(interval)
  }, [loadMissedAlerts])

  async function handlePopoverChange(open: boolean) {
    setPopoverOpen(open)
    if (!open && missedAlerts.length > 0) {
      setMissedAlerts([])
      try {
        await dismissMissedAlerts()
      } catch {
        // ignore
      }
    }
  }

  const hasMissed = missedAlerts.length > 0

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

        <Popover open={popoverOpen} onOpenChange={handlePopoverChange}>
          <PopoverTrigger asChild>
            <button
              className={clsx(
                "relative rounded-lg p-2 transition-colors hover:bg-secondary text-muted-foreground",
                notifStatus === "denied" && "opacity-50",
              )}
              title={
                notifStatus === "denied" ? "Notifications blocked — enable in browser settings" :
                "Notifications"
              }
            >
              {notifStatus === "denied" ? (
                <BellOff className="size-[18px]" />
              ) : (
                <Bell className="size-[18px]" />
              )}
              {hasMissed && (
                <span className="absolute -right-0.5 -top-0.5 flex size-3">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-blue-500" />
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-3">
              <h4 className="text-sm font-semibold">Triggered Alerts</h4>
            </div>
            {missedAlerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No missed alerts
              </p>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {missedAlerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className={clsx(
                      "mt-0.5 rounded-md p-1.5",
                      alert.condition === "price_above"
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : "bg-[#EF4444]/10 text-[#EF4444]",
                    )}>
                      {alert.condition === "price_above" ? (
                        <TrendingUp className="size-3.5" />
                      ) : (
                        <TrendingDown className="size-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {alert.symbol}{" "}
                        <span className="text-muted-foreground font-normal">
                          hit ${alert.triggered_price.toFixed(2)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: ${alert.target_value?.toFixed(2)}{" "}
                        ({alert.condition === "price_above" ? "above" : "below"})
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
