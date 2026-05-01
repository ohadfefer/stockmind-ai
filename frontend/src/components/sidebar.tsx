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
  History,
  Newspaper,
  Settings,
  Sparkles,
  Zap,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const primaryNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, href: "/dashboard" },
  { icon: Briefcase, label: "Portfolio", active: false, href: "/portfolio" },
  { icon: Eye, label: "Watchlist", active: false, href: "/watchlist" },
  { icon: ScanSearch, label: "Scanner", active: false, href: "#" },
  { icon: Bot, label: "AI Advisor", active: false, href: "/conversation" },
  { icon: Newspaper, label: "News", active: false, href: "/news" },
]

const secondaryNavItems = [
  { icon: CircleUserRound, label: "My Account", active: false, href: "/account" },
  { icon: History, label: "History", active: false, href: "/conversation/history" },
]

interface SidebarProps {
  userName?: string
  userImage?: string
  userPlan?: "free" | "pro"
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar({ userName, userImage, userPlan }: SidebarProps) {
  const pathname = usePathname()
  const displayName = userName ?? "User"
  const planLabel =
    userPlan === "pro" ? "Pro plan" : userPlan === "free" ? "Free plan" : null

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      <Link href="/" className="flex items-center gap-2 px-6 py-5">
        <Zap className="size-5 text-primary" />
        <div>
          <h1 className="text-sm font-bold text-foreground">StockMind AI</h1>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Research Suite
          </p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {primaryNavItems.map((item) => (
          <NavLink key={item.label} item={item} pathname={pathname} />
        ))}
        <div className="my-2 border-t border-border" />
        {secondaryNavItems.map((item) => (
          <NavLink key={item.label} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="mt-auto border-t border-border px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-secondary hover:text-foreground",
              "outline-none focus:outline-none focus-visible:outline-none",
              "data-[state=open]:bg-secondary data-[state=open]:text-foreground",
            )}
          >
            {userImage ? (
              <img
                src={userImage}
                alt={displayName}
                className="size-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {getInitials(displayName)}
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
              <span className="w-full truncate">{displayName}</span>
              {planLabel && (
                <span className="text-xs font-normal text-muted-foreground/80">
                  {planLabel}
                </span>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/settings/general" className="cursor-pointer">
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/payments" className="cursor-pointer">
                <Sparkles className="size-4" />
                Upgrade Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/auth/logout" className="cursor-pointer">
                <LogOut className="size-4" />
                Log out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <item.icon className="size-[18px]" />
      {item.label}
    </Link>
  )
}
