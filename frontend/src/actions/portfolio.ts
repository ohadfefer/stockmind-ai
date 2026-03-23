import type { PortfolioSummary } from "@/services/portfolio-service"

export async function fetchPortfolioSummary(): Promise<PortfolioSummary | null> {
  const res = await fetch("/api/portfolio/summary")
  if (!res.ok) return null
  return res.json()
}
