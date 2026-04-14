import { NextRequest, NextResponse, NextFetchEvent } from "next/server"
import { auth0 } from "@/lib/auth0"
import { logAudit } from "@/services/audit-log-service"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId } from "@/services/account-service"
import { getClientIp } from "@/lib/request-ip"

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

  // Allow login and signup pages without session
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup"
  ) {
    return authRes
  }

  // Allow cron job routes (secured by CRON_SECRET in the route handler)
  if (request.nextUrl.pathname.startsWith("/api/jobs/")) {
    return authRes
  }

  // Allow QStash webhook routes (secured by signature verification in the route handler)
  if (request.nextUrl.pathname === "/api/alerts/check") {
    return authRes
  }

  // Protect all other routes
  const session = await auth0.getSession(request)

  if (!session) {
    const { origin } = new URL(request.url)
    return NextResponse.redirect(`${origin}/login`)
  }

  return authRes
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw.js|manifest.webmanifest|icons/|apple-touch-icon.png|apple-icon.png|logo.svg|icon.svg).*)",
  ],
}
