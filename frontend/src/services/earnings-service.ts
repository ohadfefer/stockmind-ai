import { finnhubFetch } from "@/lib/finnhub"

export type EarningsHour = "bmo" | "amc" | "dmh" | null

export type UpcomingEarnings = {
  date: string
  hour: EarningsHour
}

type FinnhubEarningsEntry = {
  date?: string
  symbol?: string
  hour?: string
}

type FinnhubEarningsResponse = {
  earningsCalendar?: FinnhubEarningsEntry[]
}

// Anchor "today" to the US-market calendar so the from-window doesn't roll
// forward early for US users between ~7 PM PT and midnight.
function nyDateParts(d: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return { y: get("year"), m: get("month"), d: get("day") }
}

function toNyIsoDate(d: Date): string {
  const { y, m, d: day } = nyDateParts(d)
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function nyIsoDatePlusYear(d: Date): string {
  const { y, m, d: day } = nyDateParts(d)
  return `${y + 1}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function normalizeHour(h: string | undefined): EarningsHour {
  if (h === "bmo" || h === "amc" || h === "dmh") return h
  return null
}

export async function getUpcomingEarnings(symbol: string): Promise<UpcomingEarnings | null> {
  const now = new Date()

  const data = (await finnhubFetch("/calendar/earnings", {
    symbol: symbol.toUpperCase(),
    from: toNyIsoDate(now),
    to: nyIsoDatePlusYear(now),
  })) as FinnhubEarningsResponse

  const entries = (data.earningsCalendar ?? [])
    .filter((e): e is FinnhubEarningsEntry & { date: string } => typeof e.date === "string" && e.date.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  const first = entries[0]
  if (!first) return null
  return { date: first.date, hour: normalizeHour(first.hour) }
}

export function describeEarningsHour(hour: EarningsHour): string {
  if (hour === "bmo") return "before market open"
  if (hour === "amc") return "after market close"
  if (hour === "dmh") return "during market hours"
  return ""
}
