"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

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

// Proxy for "soft keyboard is open" on mobile. visualViewport-based detection
// is unreliable across Android Chrome modes (innerHeight can shrink with the
// visual viewport, masking the diff), so we track input focus instead — when
// any text field is focused the keyboard is up, and we hide the footer so it
// doesn't ride the keyboard's top edge.
function useInputFocused() {
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) setFocused(true)
    }
    const onFocusOut = () => {
      queueMicrotask(() => setFocused(isField(document.activeElement)))
    }
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
    }
  }, [])
  return focused
}

export function MobileFooter() {
  const pathname = usePathname()
  const inputFocused = useInputFocused()

  // Settings has its own full-screen mobile shell (back-arrow header, no nav).
  if (pathname.startsWith("/settings")) return null

  // Hide via CSS (not unmount) so the MobileTradeDialog rendered inside stays
  // mounted — unmounting closes any currently-open dialog as a side effect.
  return (
    <nav
      className={cn(
        "shrink-0 items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden",
        inputFocused ? "hidden" : "flex",
      )}
    >
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
