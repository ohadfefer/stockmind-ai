import { ApiError, apiFetch, apiRequest, apiSend, json } from "@/actions/http"
import type { StockAlert } from "@/services/alerts/alerts-service"
import type { MissedAlert } from "@/services/alerts/missed-alerts-service"
import type { UpcomingEarnings } from "@/services/earnings-service"

export function createAlert(
  symbol: string,
  condition: string,
  targetValue: number | null,
): Promise<StockAlert> {
  return apiFetch<StockAlert>("/api/alerts", {
    method: "POST",
    ...json({ symbol, condition, targetValue }),
  })
}

export function deleteAlert(alertId: number): Promise<void> {
  return apiSend(`/api/alerts/${alertId}`, { method: "DELETE" })
}

/**
 * 404 is an answer here, not a failure: a symbol with no scheduled report has
 * no upcoming-earnings resource, and the dialog renders that as a note rather
 * than an error. Anything else still throws.
 *
 * Only *our* 404 counts. Next answers an unrouted path with a 404 too, so a
 * renamed or moved endpoint would otherwise read as "no earnings scheduled"
 * for every symbol, forever, with nothing logged. The problem+json content
 * type is what separates a real answer from a routing mistake.
 */
export async function fetchUpcomingEarnings(
  symbol: string,
): Promise<UpcomingEarnings | null> {
  const res = await apiRequest(
    `/api/stocks/upcoming-earnings?symbol=${encodeURIComponent(symbol)}`,
    { allowStatus: [404] },
  )

  if (res.status === 404) {
    const contentType = res.headers.get("content-type") ?? ""
    if (!contentType.includes("application/problem+json")) {
      throw new ApiError(
        404,
        "route_missing",
        "Endpoint not found",
        "/api/stocks/upcoming-earnings did not answer with problem+json",
      )
    }
    return null
  }

  return (await res.json()) as UpcomingEarnings
}

/**
 * Polled on a 60s interval from the header, so it runs on every page. It must
 * not redirect on an expired session: the caller is a timer, not the user, and
 * navigating away would discard whatever they were in the middle of. The
 * ApiError still throws; the component swallows it and tries again next tick.
 */
export function fetchMissedAlerts(): Promise<MissedAlert[]> {
  return apiFetch<MissedAlert[]>("/api/missed-alerts", {
    redirectOnAuthFailure: false,
  })
}

/** Emptying the collection is the dismissal — there is no per-alert read flag. */
export function dismissMissedAlerts(): Promise<void> {
  return apiSend("/api/missed-alerts", { method: "DELETE" })
}
