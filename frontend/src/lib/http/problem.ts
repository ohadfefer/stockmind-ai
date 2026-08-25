import { NextResponse } from "next/server"

/**
 * RFC 9457 problem+json — the single error shape for every route handler.
 *
 * `code` is the stable machine-readable discriminator; clients switch on it,
 * never on `title` or `detail`. `type` is derived from it so the two can't
 * drift. `detail` is human-facing and safe to show: never put a Postgres
 * error in it — constraint names leak the schema. Log those server-side and
 * return `internal()` instead.
 */
const PROBLEM_BASE = "https://getstockmind.com/problems"

export type ProblemExtras = Record<string, unknown>

export function problem(
  status: number,
  code: string,
  title: string,
  detail?: string,
  extra?: ProblemExtras,
): NextResponse {
  return NextResponse.json(
    {
      type: `${PROBLEM_BASE}/${code}`,
      title,
      status,
      ...(detail ? { detail } : {}),
      code,
      ...extra,
    },
    { status, headers: { "Content-Type": "application/problem+json" } },
  )
}

/** 204 No Content — deletes and idempotent no-op writes. */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

/** 201 Created with a Location header pointing at the new resource. */
export function created(location: string, body?: unknown): NextResponse {
  if (body === undefined) {
    return new NextResponse(null, { status: 201, headers: { Location: location } })
  }
  return NextResponse.json(body, { status: 201, headers: { Location: location } })
}

/** No session cookie, or the session expired. */
export function unauthenticated(): NextResponse {
  return problem(401, "unauthenticated", "Authentication required")
}

/**
 * Valid session, but no `users` row yet — the account was never provisioned.
 * 403 rather than 404: the caller is authenticated, they just aren't permitted
 * to act until onboarding completes. The client routes this to /onboarding.
 */
export function onboardingRequired(): NextResponse {
  return problem(
    403,
    "onboarding_required",
    "Onboarding incomplete",
    "Finish onboarding before using this endpoint.",
  )
}

/** Authenticated, but this resource isn't the caller's — or doesn't exist. */
export function notFound(resource: string): NextResponse {
  return problem(404, "not_found", `${resource} not found`)
}

/** Malformed request: missing field, wrong type, unparseable body. */
export function invalid(detail: string): NextResponse {
  return problem(400, "invalid_request", "Invalid request", detail)
}

/** Well-formed but semantically wrong — e.g. no upcoming earnings date. */
export function unprocessable(code: string, detail: string): NextResponse {
  return problem(422, code, "Unprocessable request", detail)
}

/** Valid, but conflicts with current state — order already filled, etc. */
export function conflict(code: string, detail: string): NextResponse {
  return problem(409, code, "Conflict", detail)
}

/** Request body blew the size cap before it could be parsed — see readJsonBody. */
export function payloadTooLarge(limit: number): NextResponse {
  return problem(
    413,
    "payload_too_large",
    "Payload too large",
    `Request body must be at most ${limit} bytes.`,
  )
}

/** Upstream (Finnhub, xAI, Stripe) failed or returned something unusable. */
export function badGateway(detail: string): NextResponse {
  return problem(502, "upstream_failed", "Upstream request failed", detail)
}

/** Anything unhandled. The cause is logged server-side, never returned. */
export function internal(): NextResponse {
  return problem(500, "internal_error", "Internal server error")
}
