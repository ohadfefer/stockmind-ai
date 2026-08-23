import { NextResponse } from "next/server"
import { withUser } from "@/lib/http/with-auth"
import { noContent } from "@/lib/http/problem"
import { getDefaultAccountId } from "@/services/account/account-service"
import {
  deleteMissedAlerts,
  getMissedAlerts,
} from "@/services/alerts/missed-alerts-service"

/**
 * Its own collection rather than a ?status= filter on /api/alerts: missed
 * alerts are a separate table (migration 013) with a different shape —
 * triggered_price, no status or earnings_date — so a filter over one
 * collection would have to return two different row types.
 *
 * withUser + getDefaultAccountId rather than withAccount, on both handlers.
 * withAccount resolves through getOrCreateDefaultAccount, which *writes* — and
 * the GET here is polled every 60 seconds from the header, on every page. An
 * account that doesn't exist has no missed alerts and nothing to clear, so
 * neither verb has any business provisioning one.
 */
export const GET = withUser(async (_request, { userId }) => {
  const accountId = await getDefaultAccountId(userId)
  if (accountId === null) return NextResponse.json([])

  return NextResponse.json(await getMissedAlerts(accountId))
})

/** DELETE on the collection empties it — the "seen them, clear the badge" action. */
export const DELETE = withUser(async (_request, { userId }) => {
  const accountId = await getDefaultAccountId(userId)
  if (accountId !== null) await deleteMissedAlerts(accountId)

  return noContent()
})
