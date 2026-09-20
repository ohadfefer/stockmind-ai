"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SETTINGS_NAV_ITEMS } from "@/components/settings/settings-sections"
import { cn } from "@/lib/utils"

export function SettingsMobileTabs() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Settings sections"
      className="flex overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {SETTINGS_NAV_ITEMS.map((tab) => {
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
            {tab.shortLabel ?? tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
