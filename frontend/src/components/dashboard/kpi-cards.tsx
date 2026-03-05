"use client"

import { Wallet, TrendingUp, Zap } from "lucide-react"

export function KPICards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Portfolio Value */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Portfolio Value
          </span>
          <Wallet className="size-5 text-primary" />
        </div>
        <p className="font-mono text-3xl font-bold text-foreground tracking-tight">
          $84,320.00
        </p>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5 text-[#10B981]" />
          <span className="font-mono text-sm font-semibold text-[#10B981]">
            +2.4%
          </span>
          <span className="text-sm text-muted-foreground">today</span>
        </div>
      </div>

      {/* Top Gainer */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Top Gainer
          </span>
          <TrendingUp className="size-5 text-[#10B981]" />
        </div>
        <p className="font-mono text-3xl font-bold text-foreground tracking-tight">
          NVDA
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-semibold text-[#10B981]">
            + 6.8%
          </span>
          <span className="text-sm text-muted-foreground">($924.50)</span>
        </div>
      </div>

      {/* AI Advisor Alerts */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            AI Advisor Alerts
          </span>
          <Zap className="size-5 text-[#F59E0B]" />
        </div>
        <p className="font-mono text-3xl font-bold text-foreground tracking-tight">
          4 <span className="text-lg font-semibold text-muted-foreground">Active</span>
        </p>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full border-2 border-[#10B981]" />
          <span className="font-mono text-sm font-semibold text-[#10B981]">
            2 Strong Buy
          </span>
          <span className="text-sm text-muted-foreground">signals</span>
        </div>
      </div>
    </div>
  )
}
