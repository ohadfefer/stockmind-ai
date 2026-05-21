"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { IndexQuote } from "@/services/dashboard/index-service"

interface MarketOverviewBarProps {
  data: IndexQuote[]
}

export function MarketOverviewBar({ data }: MarketOverviewBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function updateScrollState() {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    updateScrollState()
  }, [data])

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" })
  }

  return (
    <div className="relative flex items-center">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 hidden h-full cursor-pointer items-center bg-gradient-to-r from-background to-transparent pl-1 pr-3 md:flex"
        >
          <ChevronLeft className="size-5 text-foreground" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex items-center gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {data.map((index) => (
          <div
            key={index.symbol}
            className="flex shrink-0 snap-start items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5"
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {index.name}
            </span>
            <span className="font-mono text-xs font-bold text-foreground">
              {index.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`font-mono text-xs font-semibold ${
                index.changePercentage >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
              }`}
            >
              {index.changePercentage >= 0 ? "+" : ""}
              {index.changePercentage.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 hidden h-full cursor-pointer items-center bg-gradient-to-l from-background to-transparent pl-3 pr-1 md:flex"
        >
          <ChevronRight className="size-5 text-foreground" />
        </button>
      )}
    </div>
  )
}
