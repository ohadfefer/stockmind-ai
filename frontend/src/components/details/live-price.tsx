"use client"

import { useEffect, useState } from "react"
import clsx from "clsx"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, TrendingUp } from "lucide-react"

interface LivePriceProps {
  symbol: string
  initialPrice: number
  initialChange: number
  initialChangePercent: number
  previousClose: number
}

export function LivePrice({
  symbol,
  initialPrice,
  initialChange,
  initialChangePercent,
  previousClose,
}: LivePriceProps) {
  const [price, setPrice] = useState(initialPrice)
  const [isLive, setIsLive] = useState(false)

  const change = price - previousClose
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : initialChangePercent
  const isDown = change < 0

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/stocks/trades?symbol=${encodeURIComponent(symbol)}`
    )

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // The server's Finnhub feed failed. Stop rather than let EventSource
        // reconnect into the same failure every few seconds.
        if (data.error) {
          setIsLive(false)
          eventSource.close()
          return
        }
        if (data.price) {
          setPrice(data.price)
          setIsLive(true)
        }
      } catch {
        // skip
      }
    }

    // The server ends every stream before the function time limit, and a
    // stream that simply ended leaves readyState CONNECTING: EventSource
    // reconnects on its own, so stay live through it. CLOSED means the server
    // refused the connection (401, 5xx) and the browser won't retry.
    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        setIsLive(false)
        eventSource.close()
      }
    }

    return () => {
      eventSource.close()
    }
  }, [symbol])

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          ${price.toFixed(2)}
        </span>
        <Badge
          variant="destructive"
          className={clsx(
            "text-xs",
            !isDown && "bg-emerald-500 text-white hover:bg-emerald-500/90"
          )}
        >
          {isDown ? (
            <TrendingDown className="size-3.5" />
          ) : (
            <TrendingUp className="size-3.5" />
          )}
          {Math.abs(changePercent).toFixed(2)}%
        </Badge>
        <span
          className={clsx(
            "text-xs font-medium",
            isDown ? "text-destructive" : "text-emerald-500"
          )}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)} Today
        </span>
        {isLive && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        )}
      </div>
    </div>
  )
}
