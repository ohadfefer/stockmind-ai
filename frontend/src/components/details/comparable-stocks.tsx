"use client"

import { useRef } from "react"
import clsx from "clsx"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Search, TrendingDown, TrendingUp } from "lucide-react"

interface ComparableStock {
  name: string
  ticker: string
  price: number
  changePercent: number
}

const comparableStocks: ComparableStock[] = [
  { name: "Keysight Technologies", ticker: "KEYS", price: 272.43, changePercent: -4.25 },
  { name: "Alcoa Corp", ticker: "AA", price: 59.65, changePercent: -1.21 },
  { name: "Acadian Asset Management", ticker: "AAMI", price: 51.18, changePercent: -4.18 },
  { name: "American Airlines Group", ticker: "AAL", price: 11.18, changePercent: -5.17 },
  { name: "Abbott Laboratories", ticker: "ABT", price: 118.92, changePercent: 1.34 },
  { name: "Accenture plc", ticker: "ACN", price: 342.15, changePercent: -0.89 },
]

export function ComparableStocks() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 240, behavior: "smooth" })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Search className="size-4" />
        <span className="text-sm font-medium">Compare to</span>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-none"
        >
          {comparableStocks.map((stock) => (
            <Card
              key={stock.ticker}
              className="min-w-[180px] shrink-0 cursor-pointer p-4 transition-colors hover:bg-muted/50"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {stock.name}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                ${stock.price.toFixed(2)}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{stock.ticker}</span>
                <div
                  className={clsx(
                    "flex items-center gap-0.5 text-xs font-medium",
                    stock.changePercent >= 0 ? "text-accent" : "text-destructive"
                  )}
                >
                  {stock.changePercent >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {Math.abs(stock.changePercent).toFixed(2)}%
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute -right-2 top-1/2 -translate-y-1/2 rounded-full bg-card shadow-md"
          onClick={scrollRight}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
