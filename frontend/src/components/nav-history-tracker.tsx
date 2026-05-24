"use client"

import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { rememberRoute } from "@/lib/nav-history"

/**
 * Invisible tracker mounted once in the app shell. Records each non-settings
 * route — including its query string — so the mobile settings back arrow can
 * return the user to the exact tab they were on (e.g. /portfolio?tab=analyze).
 *
 * rememberRoute() ignores /settings/* paths, so switching settings tabs (which
 * are routes under /settings) never changes the exit target.
 */
function NavHistoryTrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // .toString() keeps this a stable string dependency and makes query-only
  // changes (e.g. switching ?tab=) re-run the effect so the new tab is recorded.
  const search = searchParams.toString()

  useEffect(() => {
    rememberRoute(search ? `${pathname}?${search}` : pathname)
  }, [pathname, search])

  return null
}

export function NavHistoryTracker() {
  // useSearchParams() needs a Suspense boundary; this tracker lives in the
  // (main) layout, so the boundary keeps the rest of the tree server-rendered.
  return (
    <Suspense fallback={null}>
      <NavHistoryTrackerInner />
    </Suspense>
  )
}
