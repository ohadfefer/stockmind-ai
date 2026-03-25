import { TrendingUp, TrendingDown, Activity } from "lucide-react"

export function KPICards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* AI Bullish Stock Pick */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            AI Bullish Pick
          </span>
          <TrendingUp className="size-5 text-[#10B981]" />
        </div>
        <p className="font-mono text-3xl font-bold text-foreground tracking-tight">
          NVDA
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-semibold text-[#10B981]">
            +6.8%
          </span>
          <span className="text-sm text-muted-foreground">Strong Buy signal</span>
        </div>
      </div>

      {/* AI Bearish Stock Pick */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            AI Bearish Pick
          </span>
          <TrendingDown className="size-5 text-[#EF4444]" />
        </div>
        <p className="font-mono text-3xl font-bold text-foreground tracking-tight">
          INTC
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-semibold text-[#EF4444]">
            -3.2%
          </span>
          <span className="text-sm text-muted-foreground">Strong Sell signal</span>
        </div>
      </div>

      {/* Market Sentiment */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Market Sentiment
          </span>
          <Activity className="size-5 text-[#F59E0B]" />
        </div>
        <p className="font-mono text-3xl font-bold text-foreground tracking-tight">
          Bullish
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-semibold text-[#10B981]">
            68%
          </span>
          <span className="text-sm text-muted-foreground">Fear & Greed Index</span>
        </div>
      </div>
    </div>
  )
}
