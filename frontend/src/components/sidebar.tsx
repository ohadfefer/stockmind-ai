"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  LayoutDashboard,
  Briefcase,
  CircleUserRound,
  Eye,
  ScanSearch,
  Bot,
  Newspaper,
  Settings,
  Zap,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, href: "/" },
  { icon: Briefcase, label: "Portfolio", active: false, href: "/portfolio" },
  { icon: Eye, label: "Watchlist", active: false, href: "/watchlist" },
  { icon: ScanSearch, label: "Scanner", active: false, href: "#" },
  { icon: Bot, label: "AI Advisor", active: false, href: "#" },
  { icon: Newspaper, label: "News", active: false, href: "/news" },
  { icon: CircleUserRound, label: "My Account", active: false, href: "/account" },
]

interface SidebarProps {
  userName?: string
  userImage?: string
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar({ userName, userImage }: SidebarProps) {
  const pathname = usePathname()
  const displayName = userName ?? "User"

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
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-border px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Settings className="size-[18px]" />
          Settings
        </button>
        <div className="mt-3 flex items-center justify-between px-3 pb-1">
          <div className="flex items-center gap-3">
            {userImage ? (
              <img
                src={userImage}
                alt={displayName}
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {getInitials(displayName)}
              </div>
            )}
            <p className="text-sm font-medium text-foreground">{displayName}</p>
          </div>
          <a
            href="/auth/logout"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Log out"
          >
            <LogOut className="size-4" />
          </a>
        </div>
      </div>
    </aside>
  )
}
