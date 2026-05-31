"use client"

import { usePathname } from "next/navigation"

// Pages that manage their own narrow, centered width (chat) opt out
// of the app-wide content cap so they aren't double-constrained.
const FULL_BLEED_PREFIXES = ["/conversation"]

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullBleed = FULL_BLEED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isFullBleed) return <>{children}</>

  return <div className="mx-auto w-full max-w-7xl">{children}</div>
}
