"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CandlestickChart,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fetchQuote } from "@/actions/stock-data"
import { fetchTradingInfo, type TradingInfo } from "@/actions/portfolio"
import { submitOrder } from "@/actions/orders"
import type { FinnhubQuote } from "@/services/stock/stock-service"

type Step = "form" | "confirm"

const ORDER_TYPE = "market"

/**
 * Footer "Trade" action: a bottom-sheet Dialog (same shell as
 * <MobileSymbolSearch>) that runs the place-order → confirm-order flow inline,
 * mirroring the /portfolio/trade and /portfolio/trade/confirmation pages without
 * a full navigation. On submit it routes to /portfolio/orders.
 */
export function MobileTradeDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("form")

  // Order form state.
  const [action, setAction] = useState("buy")
  const [symbol, setSymbol] = useState("")
  const [quantity, setQuantity] = useState("")
  const [quote, setQuote] = useState<FinnhubQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [tradingInfo, setTradingInfo] = useState<TradingInfo | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [debouncedSymbol, setDebouncedSymbol] = useState("")
  const [filledAt, setFilledAt] = useState("")

  // Confirm step state.
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pull cash + positions fresh each time the sheet opens.
  useEffect(() => {
    if (open && !tradingInfo) {
      fetchTradingInfo().then(setTradingInfo)
    }
  }, [open, tradingInfo])

  // Debounce the symbol used for the "currently holding" readout.
  useEffect(() => {
    if (holdingDebounceRef.current) clearTimeout(holdingDebounceRef.current)
    holdingDebounceRef.current = setTimeout(() => {
      setDebouncedSymbol(symbol.trim().toUpperCase())
    }, 1000)
    return () => {
      if (holdingDebounceRef.current) clearTimeout(holdingDebounceRef.current)
    }
  }, [symbol])

  // Debounced quote fetch on symbol change.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = symbol.trim()
    if (!trimmed) {
      setQuote(null)
      setQuoteLoading(false)
      return
    }

    setQuoteLoading(true)
    debounceRef.current = setTimeout(async () => {
      const data = await fetchQuote(trimmed)
      setQuote(data && data.c !== 0 ? data : null)
      setQuoteLoading(false)
    }, 1000)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [symbol])

  const currentPrice = quote?.c ?? null
  const estimatedValue =
    currentPrice && Number(quantity) > 0 ? currentPrice * Number(quantity) : null
  const heldShares =
    tradingInfo?.positions.find((p) => p.symbol === debouncedSymbol)?.quantity ??
    0
  const canContinue = symbol.trim() !== "" && Number(quantity) > 0

  function resetForm() {
    setStep("form")
    setAction("buy")
    setSymbol("")
    setQuantity("")
    setQuote(null)
    setQuoteLoading(false)
    setTradingInfo(null)
    setValidationError(null)
    setDebouncedSymbol("")
    setFilledAt("")
    setSubmitting(false)
    setSubmitError(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) resetForm()
  }

  async function refreshQuote() {
    const trimmed = symbol.trim()
    if (!trimmed) return
    setQuoteLoading(true)
    const data = await fetchQuote(trimmed)
    setQuote(data && data.c !== 0 ? data : null)
    setQuoteLoading(false)
  }

  function handleContinue() {
    if (!canContinue) return
    setValidationError(null)

    const qty = Number(quantity)

    if (action === "buy") {
      const cost = estimatedValue ?? 0
      const cash = tradingInfo?.cashBalance ?? 0
      if (cost > cash) {
        setValidationError(
          `Insufficient funds. Order value $${cost.toLocaleString("en-US", { minimumFractionDigits: 2 })} exceeds available cash $${cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`,
        )
        return
      }
    }

    if (action === "sell") {
      if (heldShares <= 0) {
        setValidationError(
          `You don't hold any shares of ${symbol.trim().toUpperCase()}.`,
        )
        return
      }
      if (qty > heldShares) {
        setValidationError(
          `Insufficient shares. You hold ${heldShares} but tried to sell ${qty}.`,
        )
        return
      }
    }

    setFilledAt(new Date().toISOString())
    setStep("confirm")
  }

  async function handleConfirm() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const freshQuote = await fetchQuote(symbol)
      if (!freshQuote || freshQuote.c === 0) {
        setSubmitError("Unable to fetch current price. Please try again.")
        setSubmitting(false)
        return
      }

      await submitOrder({
        symbol: symbol.toUpperCase().trim(),
        side: action as "buy" | "sell",
        orderType: ORDER_TYPE,
        quantity: Number(quantity),
        averageFillPrice: freshQuote.c,
        filledAt: filledAt || new Date().toISOString(),
      })

      setOpen(false)
      resetForm()
      router.push("/portfolio/orders")
    } catch {
      setSubmitError("Failed to submit order. Please try again.")
      setSubmitting(false)
    }
  }

  const confirmDetails = [
    { label: "Action", value: action === "buy" ? "Buy" : "Sell" },
    { label: "Symbol", value: symbol.toUpperCase().trim() },
    { label: "Quantity", value: `${quantity} shares` },
    { label: "Order Type", value: "Market" },
    {
      label: "Estimated Value",
      value:
        estimatedValue !== null
          ? `$${estimatedValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "At market price",
    },
  ]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Trade"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
        >
          <CandlestickChart className="size-5" />
          Trade
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="inset-x-0 bottom-0 top-auto flex max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-0 sm:max-w-none"
      >
        <DialogHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border px-4 py-3 text-left">
          <div className="flex items-center gap-2">
            {step === "confirm" && (
              <button
                type="button"
                onClick={() => setStep("form")}
                aria-label="Back to order form"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <DialogTitle className="text-base font-semibold">
              {step === "form" ? "Place Order" : "Confirm Order"}
            </DialogTitle>
          </div>
          <DialogClose className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <DialogDescription className="sr-only">
          {step === "form"
            ? "Place a paper trading order."
            : "Review and confirm your order."}
        </DialogDescription>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          {step === "form" ? (
            <>
              {debouncedSymbol && tradingInfo && (
                <p className="text-sm text-muted-foreground">
                  Holding{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {heldShares}
                  </span>{" "}
                  {debouncedSymbol}
                </p>
              )}

              {/* Action */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="trade-action">Action</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger id="trade-action" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Symbol */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="trade-symbol">Symbol</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="trade-symbol"
                    placeholder="e.g. AAPL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={refreshQuote}
                    disabled={!symbol.trim() || quoteLoading}
                    aria-label="Refresh quote"
                    className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`size-4 ${quoteLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
                {quoteLoading && (
                  <p className="text-xs text-muted-foreground">Loading quote…</p>
                )}
                {!quoteLoading && quote && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Price:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        ${quote.c.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      High:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        ${quote.h.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      Low:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        ${quote.l.toFixed(2)}
                      </span>
                    </span>
                  </div>
                )}
                {!quoteLoading && symbol.trim() && !quote && (
                  <p className="text-xs text-destructive">Symbol not found</p>
                )}
              </div>

              {/* Quantity */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="trade-quantity">Quantity</Label>
                <Input
                  id="trade-quantity"
                  type="number"
                  min={1}
                  placeholder="Number of shares"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  autoComplete="off"
                  inputMode="numeric"
                />
              </div>

              {/* Estimated value */}
              <div className="flex flex-col gap-2">
                <Label>Estimated Order Value</Label>
                <div className="flex h-9 items-center rounded-md border border-input bg-secondary/50 px-3 text-sm text-muted-foreground">
                  {estimatedValue !== null ? (
                    <span className="font-mono font-semibold text-foreground">
                      $
                      {estimatedValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className="mt-1 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
              </button>
              {validationError && (
                <p className="text-sm text-destructive">{validationError}</p>
              )}
            </>
          ) : (
            <>
              {/* Order summary header */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4">
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {action === "buy" ? "Buy" : "Sell"} {quantity} shares of{" "}
                    <span className="font-mono text-primary">
                      {symbol.toUpperCase().trim()}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Market order — executes at current market price
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col divide-y divide-border">
                {confirmDetails.map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center justify-between py-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {d.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>

              {submitError && (
                <p className="text-sm text-destructive">{submitError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="flex flex-1 items-center justify-center rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Edit Order
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {submitting ? "Submitting…" : "Confirm Order"}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
