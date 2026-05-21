"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "General", href: "/settings/general" },
  { label: "Accounts", href: "/settings/accounts" },
  { label: "Strategy", href: "/settings/strategy" },
  { label: "Payments", href: "/settings/payments" },
  { label: "Brokerage", href: "/settings/brokerage" },
] as const

export function SettingsMobileTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Settings sections"
      className="flex overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 -mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
