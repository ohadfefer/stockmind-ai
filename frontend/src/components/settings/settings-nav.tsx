"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type NavItem = { label: string; href: string }
type NavSection = { id: string; heading: string; items: NavItem[] }

const sections: NavSection[] = [
  {
    id: "profile",
    heading: "Profile",
    items: [
      { label: "General", href: "/settings/general" },
      { label: "Accounts", href: "/settings/accounts" },
      { label: "Strategy", href: "/settings/strategy" },
    ],
  },
  {
    id: "subscription",
    heading: "Subscription",
    items: [{ label: "Payments", href: "/settings/payments" }],
  },
  {
    id: "brokerage",
    heading: "Stockmind brokerage",
    items: [{ label: "Stockmind Brokerage", href: "/settings/brokerage" }],
  },
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section) => {
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
