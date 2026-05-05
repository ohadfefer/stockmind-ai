import type { FinnhubQuote, FinnhubProfile } from "@/services/stock/stock-service"

export async function fetchQuote(symbol: string): Promise<FinnhubQuote | null> {
  const res = await fetch(`/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`)
  if (!res.ok) return null
  return res.json()
}

export async function fetchProfile(symbol: string): Promise<FinnhubProfile | null> {
  const res = await fetch(`/api/stocks/profile?symbol=${encodeURIComponent(symbol)}`)
  if (!res.ok) return null
  return res.json()
}
