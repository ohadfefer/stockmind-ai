import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { NextResponse } from "next/server"

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  appBaseUrl: process.env.APP_BASE_URL!,
  // Force Auth0 to include the auth_time claim in the ID token so we can
  // distinguish fresh logins from silent SSO auto-logins. 30 days is well
  // above our app session lifetime; it does not force re-authentication.
  authorizationParameters: { max_age: 60 * 60 * 24 * 30 },
  async onCallback(error, context, session) {
    if (error) {
      return new NextResponse(
        `Auth callback error: ${error.message}`,
        { status: 500 }
      )
    }

    const response = NextResponse.redirect(
      new URL(context.returnTo || "/", process.env.APP_BASE_URL!)
    )

    // Flag this response so proxy.ts can log the audit row on the next
    // request (where NextRequest gives us the client IP).
    //
    // Distinguish fresh login (user typed credentials now) from auto_login
    // (user had an existing Auth0 SSO session). auth_time is when the user
    // last authenticated; iat is when this ID token was issued. A gap means
    // silent auth against an existing session.
    if (session?.user?.sub) {
      const claims = session.user as { auth_time?: number; iat?: number }
      const isAutoLogin =
        typeof claims.auth_time === "number" &&
        typeof claims.iat === "number" &&
        claims.iat - claims.auth_time > 10
      response.cookies.set(
        "sm_pending_login",
        isAutoLogin ? "auto_login" : "login",
        { maxAge: 60, path: "/", httpOnly: true, sameSite: "lax" }
      )
    }

    return response
  },
})
