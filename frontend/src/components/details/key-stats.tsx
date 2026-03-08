import { Separator } from "@/components/ui/separator"

export interface KeyStatsData {
  previousClose: number | null
  dayRange: [number | null, number | null]
  yearRange: [number | null, number | null]
  marketCap: string | null
  avgVolume: string | null
  peRatio: number | null
  dividendYield: number | null
  primaryExchange: string | null
}

interface KeyStatsProps {
  data: KeyStatsData
}

function fmt(value: number | null, decimals = 2, prefix = "$"): string {
  if (value == null || value === 0) return "-"
  return `${prefix}${value.toFixed(decimals)}`
}

function fmtRange(range: [number | null, number | null]): string {
  const [low, high] = range
  if (low == null && high == null) return "-"
  return `${fmt(low)} – ${fmt(high)}`
}

export function KeyStats({ data }: KeyStatsProps) {
  const stats = [
    { label: "PREVIOUS CLOSE", value: fmt(data.previousClose) },
    { label: "DAY RANGE", value: fmtRange(data.dayRange) },
    { label: "YEAR RANGE", value: fmtRange(data.yearRange) },
    { label: "MARKET CAP", value: data.marketCap ?? "-" },
    { label: "AVG VOLUME", value: data.avgVolume ?? "-" },
    { label: "P/E RATIO", value: data.peRatio != null ? data.peRatio.toFixed(2) : "-" },
    { label: "DIVIDEND YIELD", value: data.dividendYield != null ? `${data.dividendYield.toFixed(2)}%` : "-" },
    { label: "PRIMARY EXCHANGE", value: data.primaryExchange ?? "-" },
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
