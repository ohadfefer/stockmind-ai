"use client"

import {
  LayoutDashboard,
  Briefcase,
  Eye,
  ScanSearch,
  Bot,
  Newspaper,
  Settings,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Briefcase, label: "Portfolio", active: false },
  { icon: Eye, label: "Watchlist", active: false },
  { icon: ScanSearch, label: "Scanner", active: false },
  { icon: Bot, label: "AI Advisor", active: false },
  { icon: Newspaper, label: "News", active: false },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-6 py-5">
        <Zap className="size-5 text-primary" />
        <div>
          <h1 className="text-sm font-bold text-foreground">StockMind AI</h1>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Research Suite
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              item.active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-border px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Settings className="size-[18px]" />
          Settings
        </button>
        <div className="mt-3 flex items-center gap-3 px-3 pb-1">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            JD
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">John Doe</p>
            <p className="text-xs text-muted-foreground">Pro Plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
