"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { fetchQuote } from "@/actions/stock-data"
import { fetchTradingInfo } from "@/actions/portfolio"
import type { FinnhubQuote } from "@/services/stock/stock-service"
import type { TradingInfo } from "@/actions/portfolio"

function TradeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [action, setAction] = useState<string>(searchParams.get("action") ?? "buy")
  const [symbol, setSymbol] = useState(searchParams.get("symbol") ?? "")
  const [quantity, setQuantity] = useState(searchParams.get("quantity") ?? "")
  const [type] = useState("market")
  const [quote, setQuote] = useState<FinnhubQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [tradingInfo, setTradingInfo] = useState<TradingInfo | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [debouncedSymbol, setDebouncedSymbol] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const holdingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchTradingInfo().then(setTradingInfo)
  }, [])

  // Debounce the symbol used for holding display
  useEffect(() => {
    if (holdingDebounceRef.current) clearTimeout(holdingDebounceRef.current)
    holdingDebounceRef.current = setTimeout(() => {
      setDebouncedSymbol(symbol.trim().toUpperCase())
    }, 1000)
    return () => {
      if (holdingDebounceRef.current) clearTimeout(holdingDebounceRef.current)
    }
  }, [symbol])

  // Debounced quote fetch on symbol change
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

  async function refreshQuote() {
    const trimmed = symbol.trim()
    if (!trimmed) return
    setQuoteLoading(true)
    const data = await fetchQuote(trimmed)
    setQuote(data && data.c !== 0 ? data : null)
    setQuoteLoading(false)
  }

  // When the form mounts already populated (e.g. editing back from the
  // confirmation page), fetch the quote immediately instead of waiting out the
  // debounce, so the funds check has real data right away.
  useEffect(() => {
    if (symbol.trim()) refreshQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentPrice = quote?.c ?? null
  const estimatedValue =
    currentPrice && Number(quantity) > 0
      ? currentPrice * Number(quantity)
      : null

  const heldShares = tradingInfo?.positions.find(
    (p) => p.symbol === debouncedSymbol
  )?.quantity ?? 0

  // A buy requires a loaded quote so the funds check below has a real cost; a
  // sell is validated against held shares, not price. This also closes the
  // window where a pre-filled form could submit before the quote resolved.
  const canContinue =
    symbol.trim() !== "" &&
    Number(quantity) > 0 &&
    (action === "sell" || quote !== null)

  function handleContinue() {
    if (!canContinue) return
    setValidationError(null)

    const qty = Number(quantity)

    if (action === "buy") {
      const cost = estimatedValue ?? 0
      const cash = tradingInfo?.cashBalance ?? 0
      if (cost > cash) {
        setValidationError(
          `Insufficient funds. Order value $${cost.toLocaleString("en-US", { minimumFractionDigits: 2 })} exceeds available cash $${cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}.`
        )
        return
      }
    }

    if (action === "sell") {
      if (heldShares <= 0) {
        setValidationError(`You don't hold any shares of ${symbol.trim().toUpperCase()}.`)
        return
      }
      if (qty > heldShares) {
        setValidationError(
          `Insufficient shares. You hold ${heldShares} but tried to sell ${qty}.`
        )
        return
      }
    }

    const params = new URLSearchParams({
      action,
      symbol: symbol.toUpperCase().trim(),
      quantity,
      type,
      ...(estimatedValue !== null && { estimatedValue: estimatedValue.toFixed(2) }),
      filledAt: new Date().toISOString(),
    })
    router.push(`/portfolio/trade/confirmation?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/portfolio"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Portfolio
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Place Order</h1>
          {debouncedSymbol && tradingInfo && (
            <span className="text-sm text-muted-foreground">
              · Holding <span className="font-mono font-semibold text-foreground">{heldShares}</span> {debouncedSymbol}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Trade stocks with your paper trading account
        </p>
      </div>

      <div className="mx-auto w-full max-w-lg rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-5">
          {/* Action */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="action">Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger id="action" className="w-full">
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
            <Label htmlFor="symbol">Symbol</Label>
            <div className="flex items-center gap-2">
              <Input
                id="symbol"
                placeholder="e.g. AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                onClick={refreshQuote}
                disabled={!symbol.trim() || quoteLoading}
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${quoteLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
            {quoteLoading && (
              <p className="text-xs text-muted-foreground">Loading quote…</p>
            )}
            {!quoteLoading && quote && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Price: <span className="font-mono font-semibold text-foreground">${quote.c.toFixed(2)}</span>
                </span>
                <span>
                  High: <span className="font-mono font-semibold text-foreground">${quote.h.toFixed(2)}</span>
                </span>
                <span>
                  Low: <span className="font-mono font-semibold text-foreground">${quote.l.toFixed(2)}</span>
                </span>
              </div>
            )}
            {!quoteLoading && symbol.trim() && !quote && (
              <p className="text-xs text-destructive">Symbol not found</p>
            )}
          </div>

          {/* Quantity */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              placeholder="Number of shares"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Order Type</Label>
            <Select value={type} disabled>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Order Value */}
          <div className="flex flex-col gap-2">
            <Label>Estimated Order Value</Label>
            <div className="flex h-9 items-center rounded-md border border-input bg-secondary/50 px-3 text-sm text-muted-foreground">
              {estimatedValue !== null ? (
                <span className="font-mono font-semibold text-foreground">
                  ${estimatedValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              ) : (
                "—"
              )}
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TradePage() {
  return (
    <Suspense>
      <TradeForm />
    </Suspense>
  )
}
