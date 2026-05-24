"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { LayoutDashboard, Briefcase, Bot, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { MobileTradeDialog } from "@/components/mobile/mobile-trade-dialog"

// First four mirror the sidebar's primary nav (label + href kept in sync).
const footerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Briefcase, label: "Portfolio", href: "/portfolio" },
  { icon: Bot, label: "Advisor", href: "/conversation" },
  { icon: Newspaper, label: "News", href: "/news" },
]

export function MobileFooter() {
  const pathname = usePathname()

  // Settings has its own full-screen mobile shell (back-arrow header, no nav).
  if (pathname.startsWith("/settings")) return null

  return (
    <nav className="flex shrink-0 items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      {footerNavItems.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium whitespace-nowrap transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        )
      })}

      {/* Trade opens the order/confirm bottom sheet. */}
      <MobileTradeDialog />
    </nav>
  )
}
