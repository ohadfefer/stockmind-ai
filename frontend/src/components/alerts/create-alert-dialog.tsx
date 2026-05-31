"use client"

import { useEffect, useState, useTransition } from "react"
import { Bell, TrendingUp, TrendingDown, Sparkles, CalendarDays, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createAlert, fetchUpcomingEarnings } from "@/actions/alerts"
import { useNotifications } from "@/hooks/use-notifications"
import { describeEarningsHour, type UpcomingEarnings } from "@/services/earnings-service"
import { parseIsoDateLocal } from "@/lib/utils"

type AlertCondition = "price_above" | "price_below" | "earnings" | "ai_signal"

const alertTypes: {
  value: AlertCondition
  label: string
  icon: React.ReactNode
  disabled: boolean
}[] = [
    { value: "price_above", label: "Price Above", icon: <TrendingUp className="size-4" />, disabled: false },
    { value: "price_below", label: "Price Below", icon: <TrendingDown className="size-4" />, disabled: false },
    { value: "earnings", label: "Earnings", icon: <CalendarDays className="size-4" />, disabled: false },
    { value: "ai_signal", label: "AI Signal", icon: <Sparkles className="size-4" />, disabled: true },
  ]

function formatEarningsDate(iso: string): string {
  return parseIsoDateLocal(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function CreateAlertDialog({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false)
  const [condition, setCondition] = useState<AlertCondition | null>(null)
  const [targetValue, setTargetValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const [earnings, setEarnings] = useState<UpcomingEarnings | null>(null)
  const [earningsLoading, setEarningsLoading] = useState(false)
  const [earningsError, setEarningsError] = useState<string | null>(null)
  const { status: notifStatus, subscribe } = useNotifications()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setCondition(null)
      setTargetValue("")
      setEarnings(null)
      setEarningsError(null)
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (val === "" || /^\d+\.?\d{0,2}$/.test(val)) {
      setTargetValue(val)
    }
  }

  useEffect(() => {
    if (condition !== "earnings") return
    let cancelled = false
    setEarningsLoading(true)
    setEarningsError(null)
    setEarnings(null)
    fetchUpcomingEarnings(symbol)
      .then((res) => {
        if (cancelled) return
        if (!res) setEarningsError("No upcoming earnings date found.")
        else setEarnings(res)
      })
      .catch(() => {
        if (!cancelled) setEarningsError("Couldn't load earnings date.")
      })
      .finally(() => {
        if (!cancelled) setEarningsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [condition, symbol])

  const canSubmit =
    condition !== null &&
    !isPending &&
    (condition === "earnings"
      ? earnings !== null && !earningsLoading
      : targetValue !== "" && Number(targetValue) > 0)

  function handleSubmit() {
    if (!condition) return
    if (condition !== "earnings" && !targetValue) return
    startTransition(async () => {
      if (notifStatus !== "subscribed") {
        await subscribe()
        // After subscribe(), if permission was denied the status stays non-subscribed.
        // We check Notification.permission directly since hook state may not have updated yet.
        if (Notification.permission !== "granted") return
      }
      const value = condition === "earnings" ? null : Number(targetValue)
      await createAlert(symbol, condition, value)
      handleOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
        >
          <Bell className="size-4" />
          Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Alert for {symbol}</DialogTitle>
          <DialogDescription>
            Get notified when conditions are met.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Alert type selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Alert Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {alertTypes.map((type) => (
                <button
                  key={type.value}
                  disabled={type.disabled}
                  onClick={() => {
                    setCondition(type.value)
                    setTargetValue("")
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${condition === type.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                    } disabled:pointer-events-none disabled:opacity-40`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price input — hidden for earnings */}
          {condition !== "earnings" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Target Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={targetValue}
                  onChange={handlePriceChange}
                  disabled={!condition}
                  className="pl-7 font-mono"
                />
              </div>
            </div>
          )}

          {/* Earnings date preview */}
          {condition === "earnings" && (
            <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm">
              {earningsLoading && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  Looking up next earnings date…
                </span>
              )}
              {earningsError && (
                <span className="text-destructive">{earningsError}</span>
              )}
              {earnings && !earningsLoading && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">We&apos;ll notify you on</span>
                  <span className="font-medium text-foreground">
                    {formatEarningsDate(earnings.date)}
                    {earnings.hour && (
                      <span className="text-muted-foreground font-normal">
                        {" "}({describeEarningsHour(earnings.hour)})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {notifStatus === "denied" && (
          <p className="text-sm text-destructive">
            Enable notifications in your browser settings to receive alerts.
          </p>
        )}

        <DialogFooter>
          <Button
            disabled={!canSubmit || notifStatus === "denied"}
            onClick={handleSubmit}
            className="w-full sm:w-auto"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Create Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
