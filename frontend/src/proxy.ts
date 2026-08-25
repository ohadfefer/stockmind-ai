import { NextRequest, NextResponse, NextFetchEvent } from "next/server"
import { auth0 } from "@/lib/auth0"
import { logAudit } from "@/services/audit-log-service"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account/account-service"
import { getClientIp } from "@/lib/request-ip"
import { isPublicApiRoute } from "@/lib/http/public-routes"
import { unauthenticated } from "@/lib/http/problem"

async function logAuthEvent(
  request: NextRequest,
  action: "login" | "auto_login" | "logout",
) {
  const session = await auth0.getSession(request)
  const sub = session?.user?.sub
  if (!sub) return
  const userId = await getUserIdByAuth0Id(sub)
  if (!userId) return
  const accountId = await getDefaultAccountId(userId)
  await logAudit({
    userId,
    accountId,
    action,
    ipAddress: getClientIp(request),
  })
}

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Log logout BEFORE middleware clears the session. waitUntil keeps the
  // function alive for the background write without blocking the response.
  if (request.nextUrl.pathname === "/auth/logout") {
    event.waitUntil(logAuthEvent(request, "logout"))
  }

  const authRes = await auth0.middleware(request)

  // Log login/auto_login on the first request after a successful callback.
  // onCallback sets sm_pending_login; this is the first request where we
  // have both the NextRequest (for IP) and the freshly saved session.
  const pendingLogin = request.cookies.get("sm_pending_login")?.value
  if (pendingLogin === "login" || pendingLogin === "auto_login") {
    event.waitUntil(logAuthEvent(request, pendingLogin))
    authRes.cookies.delete("sm_pending_login")
  }

  // Let Auth0 SDK handle /auth/* routes
  if (request.nextUrl.pathname.startsWith("/auth")) {
    return authRes
  }

  // Allow the public landing page (marketing + auth CTAs) without session
  if (request.nextUrl.pathname === "/") {
    return authRes
  }

  // Allow the routes that carry their own authentication — the health probe,
  // the CRON_SECRET job, the QStash webhooks and the Stripe webhook. The list
  // lives in lib/http/public-routes so this gate and check-route-auth.mjs read
  // the same array and cannot drift.
  //
  // This used to allow the whole "/api/jobs/" prefix. Exact paths only now: a
  // prefix exempts every future route in that subtree from both this gate and
  // the guard script, so the next job endpoint would ship publicly reachable
  // without anyone making an auth decision about it.
  if (isPublicApiRoute(request.nextUrl.pathname)) {
    return authRes
  }

  // Protect all other routes
  const session = await auth0.getSession(request)

  if (!session) {
    // An API path answers 401 problem+json; only a page navigation redirects.
    // A 302 to the landing page turned every expired-session XHR into a
    // 200 text/html the client then tried to parse as JSON — a silent failure
    // at best, and on the chat stream it rendered the landing page's markup
    // into the assistant bubble. Identical body to the route wrappers'
    // unauthenticated(), so apiRequest cannot tell the two apart.
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return unauthenticated()
    }

    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/`)
  }

  return authRes
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|manifest.webmanifest|icons/|onboarding/interests/|apple-touch-icon.png|apple-icon.png|logo.svg|icon.svg).*)",
  ],
}
