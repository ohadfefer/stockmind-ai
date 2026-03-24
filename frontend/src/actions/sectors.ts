import type { SectorPerformance } from "@/services/sector-service"

export async function fetchSectorPerformance(
  period: "1D" | "1W"
): Promise<SectorPerformance[] | null> {
  const res = await fetch(`/api/sectors/performance?period=${period}`)
  if (!res.ok) return null
  return res.json()
}
