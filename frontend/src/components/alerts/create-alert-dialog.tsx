"use client"

import { useState, useTransition } from "react"
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
import { createAlert } from "@/actions/alerts"

type AlertCondition = "price_above" | "price_below" | "earnings" | "ai_signal"

const alertTypes: {
  value: AlertCondition
  label: string
  icon: React.ReactNode
  disabled: boolean
}[] = [
  { value: "price_above", label: "Price Above", icon: <TrendingUp className="size-4" />, disabled: false },
  { value: "price_below", label: "Price Below", icon: <TrendingDown className="size-4" />, disabled: false },
  { value: "earnings", label: "Earnings", icon: <CalendarDays className="size-4" />, disabled: true },
  { value: "ai_signal", label: "AI Signal", icon: <Sparkles className="size-4" />, disabled: true },
]

export function CreateAlertDialog({ symbol }: { symbol: string }) {
  const [open, setOpen] = useState(false)
  const [condition, setCondition] = useState<AlertCondition | null>(null)
  const [targetValue, setTargetValue] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setCondition(null)
      setTargetValue("")
    }
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (val === "" || /^\d+\.?\d{0,2}$/.test(val)) {
      setTargetValue(val)
    }
  }

  const canSubmit = condition && targetValue && Number(targetValue) > 0 && !isPending

  function handleSubmit() {
    if (!condition || !targetValue) return
    startTransition(async () => {
      await createAlert(symbol, condition, Number(targetValue))
      handleOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
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
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    condition === type.value
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

          {/* Price input */}
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
        </div>

        <DialogFooter>
          <Button
            disabled={!canSubmit}
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
