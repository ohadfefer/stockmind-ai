"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  LayoutDashboard,
  Briefcase,
  CircleUserRound,
  Eye,
  Bot,
  History,
  Newspaper,
  Settings,
  Sparkles,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const SIDEBAR_STORAGE_KEY = "stockmind:sidebar-collapsed"

const primaryNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Briefcase, label: "Portfolio", href: "/portfolio" },
  { icon: Eye, label: "Watchlist", href: "/watchlist" },
  { icon: Bot, label: "AI Advisor", href: "/conversation" },
  { icon: Newspaper, label: "News", href: "/news" },
]

const secondaryNavItems = [
  { icon: CircleUserRound, label: "My Account", href: "/account" },
  { icon: History, label: "History", href: "/conversation/history" },
]

export interface SidebarUserProps {
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

export function Sidebar(props: SidebarUserProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Restore the persisted preference after mount to avoid a hydration mismatch
  // (the server always renders the expanded default).
  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (saved !== null) setCollapsed(saved === "true")
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <SidebarBody
        {...props}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
    </aside>
  )
}

export function MobileSidebar(props: SidebarUserProps) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open navigation"
        className="-ml-2 flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 border-r border-border bg-card p-0 sm:max-w-xs"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarBody {...props} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

function SidebarBody({
  userName,
  userImage,
  userPlan,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: SidebarUserProps & {
  onNavigate?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const displayName = userName ?? "User"
  const planLabel =
    userPlan === "pro" ? "Pro plan" : userPlan === "free" ? "Free plan" : null

  return (
    <>
      <div
        className={cn(
          "flex items-center py-5",
          collapsed ? "justify-center px-2" : "justify-between px-4",
        )}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="StockMind AI home"
          className="flex items-center gap-2"
        >
          {/* App icon — same /logo.svg used by the favicon, apple-touch and
              PWA manifest. alt="" because the Link already carries the
              "StockMind AI home" label. */}
          <img src="/logo.svg" alt="" className="size-7 shrink-0" />
          {!collapsed && (
            <h1 className="text-sm font-bold text-foreground">StockMind</h1>
          )}
        </Link>
        {!collapsed && onToggleCollapse && (
          <CollapseToggle collapsed={false} onClick={onToggleCollapse} />
        )}
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 pt-2",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.label}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ))}
        <div className="my-2 border-t border-border" />
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.label}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div
        className={cn(
          "mt-auto border-t border-border py-3",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {collapsed && onToggleCollapse && (
          <div className="mb-1 flex justify-center">
            <CollapseToggle collapsed onClick={onToggleCollapse} />
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={collapsed ? displayName : undefined}
            className={cn(
              "flex w-full items-center rounded-lg py-2 text-left text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-secondary hover:text-foreground",
              "outline-none focus:outline-none focus-visible:outline-none",
              "data-[state=open]:bg-secondary data-[state=open]:text-foreground",
              collapsed ? "justify-center px-0" : "gap-3 px-3",
            )}
          >
            {userImage ? (
              <img
                src={userImage}
                alt={displayName}
                className="size-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {getInitials(displayName)}
              </div>
            )}
            {!collapsed && (
              <div className="flex min-w-0 flex-1 flex-col items-start leading-tight">
                <span className="w-full truncate">{displayName}</span>
                {planLabel && (
                  <span className="text-xs font-normal text-muted-foreground/80">
                    {planLabel}
                  </span>
                )}
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-52">
            <DropdownMenuItem asChild>
              <Link
                href="/settings/general"
                onClick={onNavigate}
                className="cursor-pointer"
              >
                <Settings className="size-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings/payments"
                onClick={onNavigate}
                className="cursor-pointer"
              >
                <Sparkles className="size-4" />
                Upgrade Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href="/auth/logout"
                onClick={onNavigate}
                className="cursor-pointer"
              >
                <LogOut className="size-4" />
                Log out
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

function CollapseToggle({
  collapsed,
  onClick,
}: {
  collapsed: boolean
  onClick: () => void
}) {
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Icon className="size-[18px]" />
    </button>
  )
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

function NavLink({
  item,
  pathname,
  onNavigate,
  collapsed = false,
}: {
  item: NavItem
  pathname: string
  onNavigate?: () => void
  collapsed?: boolean
}) {
  const active = pathname === item.href
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <item.icon className="size-[18px] shrink-0" />
      {!collapsed && item.label}
    </Link>
  )
}
