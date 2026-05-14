"use client"

import { useRouter } from "next/navigation"
import { DateRangePicker } from "@/components/date-range-picker"
import { parseLocalDate, toLocalDateString } from "@/services/news-service"

interface CompanyNewsDateFilterProps {
  symbol: string
  from: string
  to: string
}

export function CompanyNewsDateFilter({ symbol, from, to }: CompanyNewsDateFilterProps) {
  const router = useRouter()

  const handleRangeChange = (newFrom: Date, newTo: Date) => {
    const params = new URLSearchParams({
      from: toLocalDateString(newFrom),
      to: toLocalDateString(newTo),
    })
    router.push(`/news/${symbol}?${params.toString()}`)
  }

  return (
    <DateRangePicker
      from={parseLocalDate(from)}
      to={parseLocalDate(to)}
      onRangeChange={handleRangeChange}
    />
  )
}
