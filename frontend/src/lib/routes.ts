// Route predicates shared by the client components that shape the app shell.
// They're defined once because a route rename has to move all of them at the
// same time — a partial update leaves half the chrome behind (footer hidden
// but the app header back, say) with nothing to fail the build.

// Matches a route and everything nested under it, but not a sibling that
// merely starts with the same characters (/settings-v2).
export function matchesRoute(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

// /settings runs its own shell: full-bleed so the nav sits flush against the
// app sidebar, its own back-arrow header on mobile, and no mobile footer.
export function isSettingsRoute(pathname: string): boolean {
  return matchesRoute(pathname, "/settings")
}
