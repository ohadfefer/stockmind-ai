// Remembers the last route the user was on *outside* of settings — including
// its query string (e.g. /portfolio?tab=analyze) so the back arrow returns to
// the exact tab — while ignoring navigation inside settings (those are
// /settings/* routes and are never recorded).
//
// Backed by sessionStorage so it survives full reloads within the tab (e.g. the
// Stripe checkout redirect). Falls back to /dashboard when there's nothing
// recorded — a direct load of /settings/* with no prior in-app navigation.

const STORAGE_KEY = "stockmind:settings-back-target"
const FALLBACK_HREF = "/dashboard"

/** Record a visited route. No-ops for /settings/* so tabs don't overwrite it. */
export function rememberRoute(path: string) {
  if (typeof window === "undefined" || path.startsWith("/settings")) return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, path)
  } catch {
    // sessionStorage can throw (private mode, blocked storage) — back falls back.
  }
}

/** Where the settings back arrow should go. */
export function getBackTarget(): string {
  if (typeof window === "undefined") return FALLBACK_HREF
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? FALLBACK_HREF
  } catch {
    return FALLBACK_HREF
  }
}
