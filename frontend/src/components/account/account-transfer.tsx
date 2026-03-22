"use client"

import { useState } from "react"
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
import { cn } from "@/lib/utils"
import { submitTransfer } from "@/actions/transfers"

type TransferDirection = "deposit" | "withdrawal"
type TransferMethod = "bank_transfer" | "wire" | "internal"

interface AccountTransferProps {
  currency: string
}

export function AccountTransfer({ currency }: AccountTransferProps) {
  const router = useRouter()
  const [direction, setDirection] = useState<TransferDirection>("deposit")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<TransferMethod>("bank_transfer")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const symbol = currency === "USD" ? "$" : currency

  async function handleSubmit() {
    const parsed = parseFloat(amount)
    if (!parsed || parsed <= 0) return

    setSubmitting(true)
    try {
      await submitTransfer({ direction, amount: parsed, method, description: description || undefined })
      setSubmitted(true)
      setAmount("")
      setDescription("")
      // Refresh page data after the 10s resolve window
      setTimeout(() => router.refresh(), 11_000)
    } catch {
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
            onValueChange={(v) => { setDirection(v as TransferDirection); setSubmitted(false) }}
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
              onChange={(e) => { setAmount(e.target.value); setSubmitted(false) }}
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
        <Button
          className="w-full"
          size="lg"
          disabled={submitting || !amount || parseFloat(amount) <= 0}
          onClick={handleSubmit}
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {direction === "deposit" ? "Deposit" : "Withdraw"} Funds
        </Button>

        {submitted && (
          <p className="text-sm text-center text-muted-foreground">
            Transfer initiated — it will be processed in a few seconds.
          </p>
        )}
      </div>
    </div>
  )
}
