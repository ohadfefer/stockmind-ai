"use client"

const indices = [
  { name: "S&P 500", value: "5,123.42", change: "+0.12%", positive: true },
  { name: "NASDAQ", value: "16,274.94", change: "-0.05%", positive: false },
  { name: "DJIA", value: "39,127.14", change: "+0.21%", positive: true },
  { name: "RUSSELL 2K", value: "2,054.12", change: "+0.45%", positive: true },
  { name: "GOLD", value: "2,156.40", change: "-0.12%", positive: false },
]

export function MarketOverviewBar() {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      {indices.map((index) => (
        <div
          key={index.name}
          className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5"
        >
          <span className="text-xs font-semibold text-muted-foreground">
            {index.name}
          </span>
          <span className="font-mono text-xs font-bold text-foreground">
            {index.value}
          </span>
          <span
            className={`font-mono text-xs font-semibold ${
              index.positive ? "text-[#10B981]" : "text-[#EF4444]"
            }`}
          >
            {index.change}
          </span>
        </div>
      ))}
    </div>
  )
}
