"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
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
import type { FinnhubQuote } from "@/services/stock-service"

export default function TradePage() {
  const router = useRouter()
  const [action, setAction] = useState<string>("buy")
  const [symbol, setSymbol] = useState("")
  const [quantity, setQuantity] = useState("")
  const [type] = useState("market")
  const [quote, setQuote] = useState<FinnhubQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function refreshQuote() {
    const trimmed = symbol.trim()
    if (!trimmed) return
    setQuoteLoading(true)
    const data = await fetchQuote(trimmed)
    setQuote(data && data.c !== 0 ? data : null)
    setQuoteLoading(false)
  }

  // Debounced quote fetch on symbol change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = symbol.trim()
    if (!trimmed) {
      setQuote(null)
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
    currentPrice && Number(quantity) > 0
      ? currentPrice * Number(quantity)
      : null

  const canContinue = symbol.trim() !== "" && Number(quantity) > 0

  function handleContinue() {
    if (!canContinue) return
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
        <h1 className="text-2xl font-bold text-foreground">Place Order</h1>
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
        </div>
      </div>
    </div>
  )
}
