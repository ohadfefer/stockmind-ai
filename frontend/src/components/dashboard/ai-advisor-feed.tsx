"use client"

import { Sparkles } from "lucide-react"

const alerts = [
  {
    ticker: "NVDA",
    tickerBg: "bg-[#10B981]/15 text-[#10B981]",
    type: "STRONG BUY ALERT",
    typeColor: "text-[#10B981]",
    text: "Bullish pattern detected following quarterly earnings report. Technical indicators confirm momentum.",
    time: "2 mins ago",
  },
  {
    ticker: "AMZN",
    tickerBg: "bg-primary/15 text-primary",
    type: "ANALYSIS UPDATE",
    typeColor: "text-primary",
    text: "Projected 12% revenue growth in AWS segment likely to drive price targets higher in Q3.",
    time: "1 hour ago",
  },
  {
    ticker: "TSLA",
    tickerBg: "bg-[#EF4444]/15 text-[#EF4444]",
    type: "SENTIMENT DROP",
    typeColor: "text-[#EF4444]",
    text: "Negative news cycle regarding production delays is impacting short-term retail sentiment.",
    time: "3 hours ago",
  },
]

export function AIAdvisorFeed() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">
          AI Advisor Feed
        </h2>
        <Sparkles className="size-5 text-primary" />
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pb-4">
        {alerts.map((alert, i) => (
          <div key={i} className="flex gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${alert.tickerBg}`}
            >
              {alert.ticker}
            </div>
            <div className="flex flex-col gap-1">
              <span
                className={`text-xs font-bold uppercase tracking-wide ${alert.typeColor}`}
              >
                {alert.type}
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {alert.text}
              </p>
              <span className="text-xs text-muted-foreground/60">
                {alert.time}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <button className="w-full rounded-lg border border-border py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          Ask AI Specialist
        </button>
      </div>
    </div>
  )
}
