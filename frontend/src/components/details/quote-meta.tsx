"use client"

import { useEffect, useState } from "react"

const EASTERN_TZ = "America/New_York"

function formatEastern(date: Date): string {
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: EASTERN_TZ,
  })
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: EASTERN_TZ,
  })
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TZ,
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT-4"
  return `${day}, ${time} ${offset.replace("GMT", "UTC")}`
}

interface QuoteMetaProps {
  currency: string
}

export function QuoteMeta({ currency }: QuoteMetaProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const msUntilNextMinute = 60_000 - (Date.now() % 60_000)
    let intervalId: ReturnType<typeof setInterval>
    const timeoutId = setTimeout(() => {
      setNow(new Date())
      intervalId = setInterval(() => setNow(new Date()), 60_000)
    }, msUntilNextMinute)
    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [])

  if (!now) return null

  return (
    <p className="text-xs text-muted-foreground">
      {formatEastern(now)} · {currency}
    </p>
  )
}
