"use client"

import { Search, Bell } from "lucide-react"

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickers, news, or AI analysis..."
            className="h-9 w-full rounded-lg border border-border bg-secondary pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-3 py-1">
          <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-xs font-semibold text-[#10B981] tracking-wide uppercase">
            Market Open
          </span>
        </div>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="size-[18px]" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  )
}
