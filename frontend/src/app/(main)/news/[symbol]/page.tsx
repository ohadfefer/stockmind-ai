"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { NewsFeed } from "@/components/details/news-feed"
import { DateRangePicker } from "@/components/date-range-picker"

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

export default function SymbolNewsPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const upperSymbol = symbol.toUpperCase()

  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const [from, setFrom] = useState(twoDaysAgo)
  const [to, setTo] = useState(now)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <DateRangePicker
          from={from}
          to={to}
          onRangeChange={(newFrom, newTo) => {
            setFrom(newFrom)
            setTo(newTo)
          }}
        />
      </div>
      <NewsFeed
        symbol={upperSymbol}
        full
        from={toDateString(from)}
        to={toDateString(to)}
      />
    </div>
  )
}
