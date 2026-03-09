import { NextRequest, NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0"

export async function proxy(request: NextRequest) {
  const authRes = await auth0.middleware(request)

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
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
}
