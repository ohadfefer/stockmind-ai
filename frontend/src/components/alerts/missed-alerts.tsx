"use client"

import { Bell, BellOff, TrendingUp, TrendingDown, CalendarDays } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import clsx from "clsx"
import { useNotifications } from "@/hooks/use-notifications"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { fetchMissedAlerts, dismissMissedAlerts } from "@/actions/alerts"
import type { MissedAlert } from "@/services/alerts/missed-alerts-service"

export function MissedAlerts() {
  const { status: notifStatus } = useNotifications()
  const [missedAlerts, setMissedAlerts] = useState<MissedAlert[]>([])
  const [popoverOpen, setPopoverOpen] = useState(false)

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
                  alert.condition === "price_above" && "bg-[#10B981]/10 text-[#10B981]",
                  alert.condition === "price_below" && "bg-[#EF4444]/10 text-[#EF4444]",
                  alert.condition === "earnings" && "bg-primary/10 text-primary",
                )}>
                  {alert.condition === "price_above" && <TrendingUp className="size-3.5" />}
                  {alert.condition === "price_below" && <TrendingDown className="size-3.5" />}
                  {alert.condition === "earnings" && <CalendarDays className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  {alert.condition === "earnings" ? (
                    <p className="text-sm font-medium">
                      {alert.symbol}{" "}
                      <span className="text-muted-foreground font-normal">
                        reports earnings today
                      </span>
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">
                        {alert.symbol}{" "}
                        <span className="text-muted-foreground font-normal">
                          hit ${alert.triggered_price?.toFixed(2)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Target: ${alert.target_value?.toFixed(2)}{" "}
                        ({alert.condition === "price_above" ? "above" : "below"})
                      </p>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
