import { fmpFetch } from "@/lib/fmp"

export interface SectorPerformance {
  sector: string
  averageChange: number
}

interface FmpSectorSnapshot {
  date: string
  sector: string
  exchange: string
  averageChange: number
}

export async function getSectorPerformance(
  period: "1D" | "1W"
): Promise<SectorPerformance[]> {
  try {
    const target = new Date()
    if (period === "1W") {
      target.setDate(target.getDate() - 7)
    }

    const data: FmpSectorSnapshot[] = await fmpFetch(
      "/sector-performance-snapshot",
      { date: target.toISOString().split("T")[0] }
    )

    return data
      .map((s) => ({
        sector: s.sector,
        averageChange: s.averageChange,
      }))
      .sort((a, b) => Math.abs(b.averageChange) - Math.abs(a.averageChange))
  } catch {
    return []
  }
}
