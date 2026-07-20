"use client"

import { useEffect, useState } from "react"

/**
 * Tracks a CSS media query. Returns false on the server and on the first
 * client render so the markup matches during hydration, then settles to the
 * real value in an effect — same tradeoff as use-mobile.ts.
 *
 * Reach for this instead of a `hidden xl:block` class when the component
 * shouldn't *mount* below the breakpoint (e.g. it subscribes to something
 * expensive), since display:none still pays every cost but painting.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return matches
}
