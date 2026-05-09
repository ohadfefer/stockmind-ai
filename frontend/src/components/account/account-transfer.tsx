"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  fetchTransferCooldown,
  submitTransfer,
  TransferCooldownError,
} from "@/actions/transfers"

type TransferDirection = "deposit" | "withdrawal"
type TransferMethod = "bank_transfer" | "wire" | "internal"

interface AccountTransferProps {
  currency: string
}

function formatCooldownRemaining(ms: number): string {
  const totalMinutes = Math.ceil(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours <= 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

function formatCooldownUnlock(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function AccountTransfer({ currency }: AccountTransferProps) {
  const router = useRouter()
  const [direction, setDirection] = useState<TransferDirection>("deposit")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<TransferMethod>("bank_transfer")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [nextAllowedAt, setNextAllowedAt] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const symbol = currency === "USD" ? "$" : currency
  const nextAllowedMs = nextAllowedAt ? new Date(nextAllowedAt).getTime() : 0
  const cooldownActive = nextAllowedMs > now
  const cooldownRemainingMs = cooldownActive ? nextAllowedMs - now : 0

  // Warn before tab close / refresh while a transfer is being processed.
  useEffect(() => {
    if (!isPending) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [isPending])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  // Load the cooldown state on mount so the button reflects server truth.
  useEffect(() => {
    let cancelled = false
    fetchTransferCooldown()
      .then((c) => {
        if (!cancelled) setNextAllowedAt(c.nextAllowedAt)
      })
      .catch(() => {
        // Treat fetch failure as "unknown" — leave the button enabled and let
        // the server reject with 429 if the cooldown is actually active.
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Tick a clock while the cooldown is active so the remaining label updates.
  useEffect(() => {
    if (!cooldownActive) return
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [cooldownActive])

  async function handleSubmit() {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return

    setSubmitting(true)
    try {
      await submitTransfer({ direction, amount: parsed, method, description: description || undefined })
      setAmount("")
      setDescription("")
      setIsPending(true)
      // Optimistically lock the next-transfer window so the UI matches the
      // server's 72h gate without waiting for the cooldown re-fetch.
      setNextAllowedAt(new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString())
      timerRef.current = setTimeout(() => {
        setIsPending(false)
        fetchTransferCooldown()
          .then((c) => setNextAllowedAt(c.nextAllowedAt))
          .catch(() => {})
        router.refresh()
      }, 11_000)
    } catch (err) {
      if (err instanceof TransferCooldownError) {
        setNextAllowedAt(err.nextAllowedAt)
      }
      // TODO: toast error
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Transfer Funds</h2>
          <p className="text-sm text-muted-foreground">
            Deposit or withdraw funds from your account
          </p>
        </div>

        {/* Transfer type */}
        <div className="space-y-3">
          <Label>Transfer Type</Label>
          <RadioGroup
            value={direction}
            onValueChange={(v) => setDirection(v as TransferDirection)}
            className="grid grid-cols-2 gap-3"
          >
            <label
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                direction === "deposit"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/25"
              )}
            >
              <RadioGroupItem value="deposit" />
              <ArrowDownToLine className="size-4 text-green-500" />
              <span className="text-sm font-medium">Deposit</span>
            </label>
            <label
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                direction === "withdrawal"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-foreground/25"
              )}
            >
              <RadioGroupItem value="withdrawal" />
              <ArrowUpFromLine className="size-4 text-red-500" />
              <span className="text-sm font-medium">Withdrawal</span>
            </label>
          </RadioGroup>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({currency})</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {symbol}
            </span>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-7 font-mono"
            />
          </div>
        </div>

        {/* Method */}
        <div className="space-y-2">
          <Label>Method</Label>
          <Select value={method} onValueChange={(v) => setMethod(v as TransferMethod)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Bank Transfer (ACH)</SelectItem>
              <SelectItem value="wire">Wire Transfer</SelectItem>
              <SelectItem value="internal">Internal Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            placeholder={direction === "deposit" ? "e.g. Funding account" : "e.g. Withdrawal to bank"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            disabled={
              submitting ||
              cooldownActive ||
              !amount ||
              parseFloat(amount) <= 0
            }
            onClick={handleSubmit}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {cooldownActive
              ? `Available in ${formatCooldownRemaining(cooldownRemainingMs)}`
              : `${direction === "deposit" ? "Deposit" : "Withdraw"} Funds`}
          </Button>
          {cooldownActive && nextAllowedAt && (
            <p className="text-center text-xs text-muted-foreground">
              Transfers are limited to one every 72 hours. Next transfer
              available {formatCooldownUnlock(nextAllowedAt)}.
            </p>
          )}
        </div>

      </div>

      <AlertDialog open={isPending}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              Processing {direction}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your {direction} is being processed. Please stay on this page — it
              will complete in a few seconds.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
