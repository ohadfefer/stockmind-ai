"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SETTINGS_SECTIONS } from "@/components/settings/settings-sections"
import { cn } from "@/lib/utils"

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-6">
      {SETTINGS_SECTIONS.map((section) => {
        const headingId = `settings-nav-${section.id}`
        return (
          <div
            key={section.id}
            role="group"
            aria-labelledby={headingId}
            className="flex flex-col gap-1"
          >
            <h2
              id={headingId}
              className="px-3 pb-1 text-base font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {section.heading}
            </h2>
            {section.items.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}
