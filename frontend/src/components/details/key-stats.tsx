import { Separator } from "@/components/ui/separator"

export interface KeyStatsData {
  previousClose: number
  dayRange: [number, number]
  yearRange: [number, number]
  marketCap: string
  avgVolume: string
  peRatio: number
  dividendYield: number
  primaryExchange: string
}

interface KeyStatsProps {
  data: KeyStatsData
}

export function KeyStats({ data }: KeyStatsProps) {
  const stats = [
    { label: "PREVIOUS CLOSE", value: `$${data.previousClose.toFixed(2)}` },
    { label: "DAY RANGE", value: `$${data.dayRange[0].toFixed(2)} – $${data.dayRange[1].toFixed(2)}` },
    { label: "YEAR RANGE", value: `$${data.yearRange[0].toFixed(2)} – $${data.yearRange[1].toFixed(2)}` },
    { label: "MARKET CAP", value: data.marketCap },
    { label: "AVG VOLUME", value: data.avgVolume },
    { label: "P/E RATIO", value: data.peRatio.toFixed(2) },
    { label: "DIVIDEND YIELD", value: `${data.dividendYield.toFixed(2)}%` },
    { label: "PRIMARY EXCHANGE", value: data.primaryExchange },
  ]

  return (
    <div className="space-y-0">
      {stats.map((stat, i) => (
        <div key={stat.label}>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
            <span className="text-sm font-semibold text-foreground">{stat.value}</span>
          </div>
          {i < stats.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}
