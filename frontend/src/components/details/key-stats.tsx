export interface KeyStatsData {
  open: number | null
  high: number | null
  low: number | null
  marketCap: string | null
  avgVolume: string | null
  dividendYield: number | null
  quarterlyDividend: number | null
  peRatio: number | null
  weekHigh52: number | null
  weekLow52: number | null
  eps: number | null
  beta: number | null
  sharesOutstanding: string | null
}

interface KeyStatsProps {
  data: KeyStatsData
}

function fmtPrice(value: number | null): string | null {
  if (value == null) return null
  return `$${value.toFixed(2)}`
}

function fmtPercent(value: number | null): string | null {
  if (value == null) return null
  return `${value.toFixed(2)}%`
}

function fmtNumber(value: number | null, decimals = 2): string | null {
  if (value == null) return null
  return value.toFixed(decimals)
}

export function KeyStats({ data }: KeyStatsProps) {
  const rows: Array<{ label: string; value: string | null }> = [
    { label: "Open", value: fmtPrice(data.open) },
    { label: "Dividend", value: fmtPercent(data.dividendYield) },
    { label: "EPS", value: fmtPrice(data.eps) },
    { label: "High", value: fmtPrice(data.high) },
    { label: "Quarterly dividend", value: fmtPrice(data.quarterlyDividend) },
    { label: "Beta", value: fmtNumber(data.beta) },
    { label: "Low", value: fmtPrice(data.low) },
    { label: "P/E ratio", value: fmtNumber(data.peRatio) },
    { label: "Shares outstanding", value: data.sharesOutstanding },
    { label: "Mkt. cap", value: data.marketCap },
    { label: "52-wk high", value: fmtPrice(data.weekHigh52) },
    { label: "Avg. vol.", value: data.avgVolume },
    { label: "52-wk low", value: fmtPrice(data.weekLow52) },
  ]

  const visible = rows.filter((row) => row.value != null)

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No statistics available.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between border-b border-border/50 py-3 last:border-b-0"
        >
          <span className="text-sm text-muted-foreground">{row.label}</span>
          <span className="text-sm font-medium text-foreground">{row.value}</span>
        </div>
      ))}
    </div>
  )
}
