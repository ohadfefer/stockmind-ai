"use client"

import { usePathname } from "next/navigation"
import { matchesRoute } from "@/lib/routes"

// Pages that manage their own narrow, centered width (chat) opt out
// of the app-wide content cap so they aren't double-constrained. Settings
// opts out too, but for the opposite reason: its nav pane has to sit flush
// against the app sidebar, which the centered cap would push away from it.
const FULL_BLEED_PREFIXES = ["/conversation", "/settings"]

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullBleed = FULL_BLEED_PREFIXES.some((prefix) =>
    matchesRoute(pathname, prefix),
  )

  if (isFullBleed) return <>{children}</>

  return <div className="mx-auto w-full max-w-7xl">{children}</div>
}
