import { withAccount } from "@/lib/http/with-auth"
import { created, invalid, unprocessable } from "@/lib/http/problem"
import { isValidSymbol } from "@/lib/symbol"
import { createAlert, type AlertCondition } from "@/services/alerts/alerts-service"
import { getUpcomingEarnings } from "@/services/earnings-service"

const ALERT_CONDITIONS: AlertCondition[] = [
  "price_above",
  "price_below",
  "earnings",
  "ai_signal",
]

function isAlertCondition(value: unknown): value is AlertCondition {
  return typeof value === "string" && (ALERT_CONDITIONS as string[]).includes(value)
}

/**
 * POST only. The alerts list has no GET because no client fetches it: the
 * table is server-rendered from `getAlerts` in `portfolio-page-data.ts`, and an
 * endpoint nothing calls is surface to secure and document for no one.
 */
export const POST = withAccount(async (request, { accountId }) => {
  const body = (await request.json().catch(() => null)) as {
    symbol?: unknown
    condition?: unknown
    targetValue?: unknown
  } | null

  if (!isValidSymbol(body?.symbol)) return invalid("Invalid symbol")
  if (!isAlertCondition(body?.condition)) return invalid("Invalid condition")

  const symbol = body.symbol.toUpperCase()
  const condition = body.condition

  if (condition === "earnings") {
    // 422 rather than 400: the request is well-formed, the symbol just has no
    // scheduled report to hang an alert on.
    const upcoming = await getUpcomingEarnings(symbol)
    if (!upcoming) {
      return unprocessable(
        "no_upcoming_earnings",
        "No upcoming earnings date found for this symbol.",
      )
    }

    const alert = await createAlert(accountId, symbol, condition, null, upcoming.date)
    return created(`/api/alerts/${alert.id}`, alert)
  }

  // Number.isFinite, not just > 0: NaN is a number and NaN <= 0 is false, so a
  // bare comparison lets it through and Postgres rejects it as a NUMERIC.
  const { targetValue } = body
  if (typeof targetValue !== "number" || !Number.isFinite(targetValue) || targetValue <= 0) {
    return invalid("targetValue must be a positive number")
  }

  const alert = await createAlert(accountId, symbol, condition, targetValue)
  return created(`/api/alerts/${alert.id}`, alert)
})
