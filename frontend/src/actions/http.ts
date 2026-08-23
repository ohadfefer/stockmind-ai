/**
 * Shared client for everything in src/actions/.
 *
 * fetch() does not throw on 401/403/409/500 — it resolves, and a bare
 * res.json() then hands the error body to components as if it were data. This
 * wrapper checks res.ok, parses the problem+json shape every route now returns,
 * and throws ApiError so callers see a failure as a failure.
 *
 * It also catches the session-expiry case that used to fail silently: the proxy
 * redirects an unauthenticated request to the landing page, so the XHR lands on
 * 200 text/html and res.ok is true. That is detected here and routed to login
 * rather than surfacing as an opaque JSON parse error.
 */

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly detail?: string
  /** RFC 9457 extension members — e.g. nextAllowedAt, remainingMs, spent. */
  readonly extra: Record<string, unknown>

  constructor(
    status: number,
    code: string,
    title: string,
    detail?: string,
    extra: Record<string, unknown> = {},
  ) {
    super(detail || title)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.detail = detail
    this.extra = extra
  }
}

export interface ApiRequestInit extends RequestInit {
  /**
   * Statuses to resolve rather than throw on, when the status *is* the answer
   * (e.g. 404 from GET /api/push-subscriptions/{id} meaning "not registered").
   */
  allowStatus?: number[]
  /**
   * Whether an auth failure may navigate the browser. Defaults to true, which
   * is right for anything the user just clicked: they asked for something, and
   * being sent to log in is a coherent answer.
   *
   * Set false for background work — polls, timers, prefetches. A 60s interval
   * that redirects on expiry yanks the page out from under whatever the user
   * is actually doing and discards unsent input. Those callers should observe
   * the expiry (the ApiError is still thrown) and let the next deliberate
   * action be what routes to login.
   */
  redirectOnAuthFailure?: boolean
}

function redirectTo(path: string) {
  if (typeof window !== "undefined") window.location.href = path
}

/** The RFC 9457 members we lift onto ApiError; anything else becomes `extra`. */
const PROBLEM_MEMBERS = new Set(["type", "title", "status", "detail", "code"])

async function toApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return new ApiError(res.status, "unknown_error", res.statusText)
  }

  const problem = body as Record<string, unknown>
  const extra = Object.fromEntries(
    Object.entries(problem).filter(([key]) => !PROBLEM_MEMBERS.has(key)),
  )

  return new ApiError(
    res.status,
    typeof problem.code === "string" ? problem.code : "unknown_error",
    typeof problem.title === "string" ? problem.title : res.statusText,
    typeof problem.detail === "string" ? problem.detail : undefined,
    extra,
  )
}

/** Runs the request and applies the shared error policy. Returns the Response. */
export async function apiRequest(
  path: string,
  init: ApiRequestInit = {},
): Promise<Response> {
  const { allowStatus = [], redirectOnAuthFailure = true, ...requestInit } = init
  const res = await fetch(path, requestInit)

  if (res.ok) {
    // A 2xx that isn't JSON means the proxy bounced us to an HTML page.
    const contentType = res.headers.get("content-type") ?? ""
    if (res.status !== 204 && contentType.includes("text/html")) {
      if (redirectOnAuthFailure) redirectTo("/auth/login")
      throw new ApiError(401, "unauthenticated", "Session expired")
    }
    return res
  }

  if (allowStatus.includes(res.status)) return res

  const error = await toApiError(res)

  // Both branches are auth failures, so one flag gates both: a background
  // caller that must not navigate must not navigate to /onboarding either.
  if (redirectOnAuthFailure) {
    if (error.status === 401) {
      redirectTo("/auth/login")
    } else if (error.status === 403 && error.code === "onboarding_required") {
      redirectTo("/onboarding")
    }
  }

  throw error
}

/**
 * Request expecting a JSON body.
 *
 * A 204 throws rather than casting undefined to T: `undefined as T` type-checks
 * at every call site and then crashes on first property access, which is worse
 * than a clear failure. Endpoints that answer 201-with-body *or* 204 — PUT on a
 * membership URL, for one — belong on apiSend, or on a variant that returns
 * `T | undefined` and forces the caller to handle both.
 */
export async function apiFetch<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const res = await apiRequest(path, init)
  if (res.status === 204) {
    throw new ApiError(
      res.status,
      "unexpected_no_content",
      "Expected a response body",
      `${path} returned 204 where a body was required`,
    )
  }
  return (await res.json()) as T
}

/** Request whose body is irrelevant — deletes, idempotent writes. */
export async function apiSend(
  path: string,
  init: ApiRequestInit = {},
): Promise<void> {
  await apiRequest(path, init)
}

/** POST/PUT/PATCH helper: sets the JSON content type and serialises the body. */
export function json(body: unknown): ApiRequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
}
