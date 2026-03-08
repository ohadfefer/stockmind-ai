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
        if (data.price && !data.error) {
          setPrice(data.price)
          setIsLive(true)
        }
      } catch {
        // skip
      }
    }

    eventSource.onerror = () => {
      setIsLive(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [symbol])

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-3">
        <span className="text-4xl font-bold tracking-tight text-foreground">
          ${price.toFixed(2)}
        </span>
        <Badge
          variant="destructive"
          className={clsx(
            "text-sm",
            !isDown && "bg-accent text-accent-foreground hover:bg-accent/90"
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
            "text-sm font-medium",
            isDown ? "text-destructive" : "text-accent"
          )}
        >
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)} Today
        </span>
        {isLive && (
          <span className="inline-flex items-center gap-1 text-xs text-accent">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            Live
          </span>
        )}
      </div>
    </div>
  )
}
