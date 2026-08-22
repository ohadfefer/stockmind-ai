/**
 * API paths reachable without an Auth0 session.
 *
 * Single source of truth for two consumers:
 *   - `src/proxy.ts`, which allowlists them before the session gate
 *   - `scripts/check-route-auth.mjs`, which asserts every *other* route
 *     handler wraps itself in withAuth/withUser/withAccount
 *
 * Keeping one array means the allowlist and the guard can't drift apart.
 * Every entry here carries its own authentication — a signature or a shared
 * secret verified inside the handler. Adding a path to this list without one
 * publishes it to the internet.
 *
 * Exact paths only, deliberately. A prefix like "/api/jobs/" would exempt every
 * future route in that subtree from both the session gate and the guard script,
 * so a new job endpoint would ship publicly reachable without anyone making an
 * auth decision about it. One line per public route is the whole point: it
 * cannot be added by accident.
 */
export const PUBLIC_API_ROUTES = [
  // Liveness probe for the ALB target group and Docker HEALTHCHECK.
  "/api/health",
  // Scheduled job — Authorization: Bearer ${CRON_SECRET} verified in the handler.
  "/api/jobs/snapshot-positions",
  // QStash webhooks — Upstash signature verified in the handler.
  "/api/alerts/check",
  "/api/alerts/check-earnings",
  // Stripe webhook — Stripe signature verified in the handler.
  "/api/stripe/webhook",
] as const

export function isPublicApiRoute(pathname: string): boolean {
  return (PUBLIC_API_ROUTES as readonly string[]).includes(pathname)
}
