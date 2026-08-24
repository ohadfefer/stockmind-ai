import { auth0 } from "@/lib/auth0"
import { findUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account/account-service"
import { internal, onboardingRequired, unauthenticated } from "@/lib/http/problem"

/**
 * Route-handler auth wrappers.
 *
 * Generalises the resolveAccountId() helper that was hand-rolled in
 * api/conversation/route.ts, so the session → userId → accountId ladder is one
 * import instead of four re-typed lines per handler. Three wrappers rather than
 * one flag, because each rung costs a DB round trip and getOrCreateDefaultAccount
 * *writes* — read-only routes must not provision an account as a side effect.
 *
 *   withAuth    — session only
 *   withUser    — + userId
 *   withAccount — + accountId (creates the default account if absent)
 *
 * All three catch anything thrown while resolving the context *or* inside the
 * handler, log it, and return a generic problem+json 500. Resolution has to be
 * inside the guard too: getOrCreateDefaultAccount writes three rows and does
 * not swallow, so an unguarded failure there would escape as Next's default
 * HTML 500 — the one response shape this file exists to prevent.
 */

type Session = NonNullable<Awaited<ReturnType<typeof auth0.getSession>>>

export interface AuthContext {
  session: Session
}

export interface UserContext extends AuthContext {
  userId: number
}

export interface AccountContext extends UserContext {
  accountId: number
}

/** Next passes `{ params: Promise<{}> }` even for non-dynamic routes. */
type EmptyParams = Record<never, never>

interface RouteContext<P> {
  params: Promise<P>
}

type Handler<C, P> = (
  request: Request,
  ctx: C,
  routeCtx: RouteContext<P>,
) => Promise<Response> | Response

type WrappedHandler<P> = (
  request: Request,
  routeCtx: RouteContext<P>,
) => Promise<Response>

/**
 * Path segments long enough to be an opaque token are replaced before logging.
 *
 * The push subscription id is base64url of the endpoint — ~360 characters that
 * decode straight back to a live device capability — and it lives in the path,
 * so logging the path verbatim would put it in CloudWatch. Dropping the query
 * string alone used to be enough, back when that endpoint arrived as
 * ?endpoint=; it stopped being enough the moment the resource became
 * addressable.
 *
 * A length rule rather than a list of sensitive routes: a list has to be
 * updated by whoever adds the next identifier-bearing path, and forgetting is
 * silent. Every id this app actually puts in a path is short — integers and
 * ticker symbols — so they stay legible for debugging, and anything long
 * enough to be a token is redacted whether or not someone thought about it.
 */
const MAX_LOGGABLE_SEGMENT = 64

function redactPath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => (segment.length > MAX_LOGGABLE_SEGMENT ? "<redacted>" : segment))
    .join("/")
}

/**
 * Runs a resolve-then-handle thunk, converting anything it throws into a
 * generic 500. Only the path is logged, never the full URL, and identifier-
 * shaped segments are redacted out of it — see redactPath. The error itself is
 * logged and never returned, because raw Postgres errors name constraints and
 * leak the schema.
 */
async function guard(
  label: string,
  request: Request,
  produce: () => Promise<Response>,
): Promise<Response> {
  try {
    return await produce()
  } catch (err) {
    const { pathname } = new URL(request.url)
    console.error(`[${label}] ${request.method} ${redactPath(pathname)} failed:`, err)
    return internal()
  }
}

export function withAuth<P = EmptyParams>(
  handler: Handler<AuthContext, P>,
): WrappedHandler<P> {
  return (request, routeCtx) =>
    guard("withAuth", request, async () => {
      const session = await auth0.getSession()
      if (!session) return unauthenticated()

      return handler(request, { session }, routeCtx)
    })
}

export function withUser<P = EmptyParams>(
  handler: Handler<UserContext, P>,
): WrappedHandler<P> {
  return (request, routeCtx) =>
    guard("withUser", request, async () => {
      const session = await auth0.getSession()
      if (!session) return unauthenticated()

      const userId = await findUserIdByAuth0Id(session.user.sub)
      if (!userId) return onboardingRequired()

      return handler(request, { session, userId }, routeCtx)
    })
}

export function withAccount<P = EmptyParams>(
  handler: Handler<AccountContext, P>,
): WrappedHandler<P> {
  return (request, routeCtx) =>
    guard("withAccount", request, async () => {
      const session = await auth0.getSession()
      if (!session) return unauthenticated()

      const userId = await findUserIdByAuth0Id(session.user.sub)
      if (!userId) return onboardingRequired()

      const accountId = await getOrCreateDefaultAccount(userId)
      return handler(request, { session, userId, accountId }, routeCtx)
    })
}
