"use client"

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

interface NavigationLoaderValue {
  startLoading: () => void
}

const NavigationLoaderContext = createContext<NavigationLoaderValue>({
  startLoading: () => {},
})

export function useNavigationLoader() {
  return useContext(NavigationLoaderContext)
}

/**
 * Returns a `goToDetails(symbol)` that shows the navigation overlay and pushes
 * to `/details/<symbol>`. Use for programmatic (onClick) detail navigation.
 */
export function useDetailsNavigation() {
  const { startLoading } = useNavigationLoader()
  const router = useRouter()
  return useCallback(
    (symbol: string) => {
      startLoading()
      router.push(`/details/${symbol}`)
    },
    [router, startLoading],
  )
}

/**
 * A `next/link` to a details page that triggers the navigation overlay on
 * click. For `<Link>`-based callers (e.g. server components) that can't use
 * the programmatic hook. Modifier-clicks (new tab) skip the overlay.
 */
export function DetailsLink({
  symbol,
  onClick,
  ...props
}: { symbol: string } & Omit<React.ComponentProps<typeof Link>, "href">) {
  const { startLoading } = useNavigationLoader()
  return (
    <Link
      href={`/details/${symbol}`}
      onClick={(e) => {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) startLoading()
        onClick?.(e)
      }}
      {...props}
    />
  )
}

/**
 * Wraps the app shell and renders a Google-Finance-style overlay (dim + top
 * progress bar) while a navigation triggered via `startLoading` is in flight.
 * The overlay covers the current page until the target route commits and the
 * URL changes, then hides itself.
 */
export function NavigationLoaderProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [active, setActive] = useState(false)
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const clearFallback = useCallback(() => {
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current)
      fallbackRef.current = undefined
    }
  }, [])

  const startLoading = useCallback(() => {
    setActive(true)
    clearFallback()
    // Safety net: if the navigation never commits (e.g. pushing the route the
    // user is already on), don't leave the overlay stuck on screen.
    fallbackRef.current = setTimeout(() => setActive(false), 10_000)
  }, [clearFallback])

  const stopLoading = useCallback(() => {
    setActive(false)
    clearFallback()
  }, [clearFallback])

  useEffect(() => clearFallback, [clearFallback])

  return (
    <NavigationLoaderContext.Provider value={{ startLoading }}>
      {/* useSearchParams() needs a Suspense boundary; giving the watcher its
          own keeps the rest of the shell server-rendered, the same split
          NavHistoryTracker uses. */}
      <Suspense fallback={null}>
        <UrlCommitWatcher onCommit={stopLoading} />
      </Suspense>
      {children}
      {active && <NavigationOverlay />}
    </NavigationLoaderContext.Provider>
  )
}

/**
 * Hides the overlay once the destination URL commits — that's what "the
 * navigation finished" means here.
 *
 * Watches the query string as well as the path. Switching watchlist tabs
 * navigates to `/watchlist?id=N`, which leaves the pathname untouched, so a
 * pathname-only watcher would hold the overlay open until the 10s safety net
 * fired. Callers must still avoid calling startLoading for a click that
 * can't change the URL (e.g. the already-active tab), since nothing commits.
 */
function UrlCommitWatcher({ onCommit }: { onCommit: () => void }) {
  const pathname = usePathname()
  // .toString() keeps this a stable string dependency, so a query-only change
  // still re-runs the effect.
  const search = useSearchParams().toString()

  useEffect(() => {
    onCommit()
  }, [pathname, search, onCommit])

  return null
}

function NavigationOverlay() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[100] cursor-wait bg-background/50 duration-150 animate-in fade-in"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-primary/25">
        <div className="h-full w-1/4 rounded-full bg-primary animate-[nav-loader-slide_1.1s_ease-in-out_infinite]" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  )
}
