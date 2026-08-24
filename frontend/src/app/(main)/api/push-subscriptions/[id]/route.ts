import { NextResponse } from "next/server"
import { withAccount, withUser } from "@/lib/http/with-auth"
import { invalid, noContent, notFound } from "@/lib/http/problem"
import { getDefaultAccountId } from "@/services/account/account-service"
import { decodePushEndpoint } from "@/lib/push-endpoint"
import {
  deleteSubscription,
  saveSubscription,
  subscriptionExists,
} from "@/services/push-subscription-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

type Params = { id: string }

/**
 * A subscription is a resource keyed by its endpoint, so the endpoint moves
 * out of the body and into the path as base64url — see lib/push-endpoint.ts
 * for why base64url rather than a hash. That is what makes PUT and DELETE
 * addressable, and it is what lets GET be a plain existence check on a URL
 * instead of ?endpoint= on a collection.
 *
 * An id that doesn't decode to an allowlisted push endpoint is a 400, not a
 * 404 — deliberately breaking with the alerts precedent, where a non-integer
 * segment 404s as "a resource that cannot exist". That reasoning holds there
 * because the client never builds an invalid alert id and nothing acts on the
 * 404. Here the id is built from browser-supplied data, and hasPushSubscription
 * treats a problem+json 404 as authority to call sub.unsubscribe() and destroy
 * the local subscription. A 404 must therefore mean "we looked and you have
 * none", never "we could not read the id". Nothing in that answer depends on
 * account rows, so there is no ownership to leak by saying so.
 *
 * The real 404 — a decodable id with no row — is still scoped by account_id in
 * every query below, so "not yours" and "not there" stay indistinguishable.
 */

/**
 * Idempotent registration. 201 when the row is new, 204 when it already
 * existed and the keys were refreshed — a browser can rotate p256dh/auth for
 * the same endpoint, and that is an update, not a create.
 *
 * No Location header: PUT's target URI already identifies the resource it
 * created (RFC 9110 §15.3.2), so a Location would only repeat the request URL.
 */
export const PUT = withAccount<Params>(
  async (request, { userId, accountId }, { params }) => {
    const endpoint = decodePushEndpoint((await params).id)
    if (!endpoint) return invalid("Not a valid push subscription id")

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return invalid("Body must be a JSON object")

    const { p256dh, auth } = body
    if (typeof p256dh !== "string" || !p256dh) return invalid("p256dh is required")
    if (typeof auth !== "string" || !auth) return invalid("auth is required")

    const { created } = await saveSubscription(accountId, endpoint, p256dh, auth)

    // Only a create is a settings change. Re-registering an endpoint the
    // account already has means push was already on for this device, and
    // logging it as an enable would record a state change that never happened.
    if (created) {
      await logAudit({
        userId,
        accountId,
        action: "settings_changed",
        details: { setting: "push_notifications", enabled: true, endpoint },
        ipAddress: getClientIp(request),
      })
    }

    return created ? new NextResponse(null, { status: 201 }) : noContent()
  },
)

/**
 * 204 whether or not a row was there — DELETE is idempotent, and "it is gone"
 * is true either way. Only the audit entry distinguishes them.
 *
 * withUser + getDefaultAccountId rather than withAccount: withAccount resolves
 * through getOrCreateDefaultAccount, which writes three rows. Provisioning an
 * account in order to delete something from it would be absurd.
 */
export const DELETE = withUser<Params>(async (request, { userId }, { params }) => {
  const endpoint = decodePushEndpoint((await params).id)
  if (!endpoint) return invalid("Not a valid push subscription id")

  const accountId = await getDefaultAccountId(userId)
  if (accountId === null) return noContent()

  const deleted = await deleteSubscription(accountId, endpoint)
  if (deleted) {
    await logAudit({
      userId,
      accountId,
      action: "settings_changed",
      details: { setting: "push_notifications", enabled: false, endpoint },
      ipAddress: getClientIp(request),
    })
  }

  return noContent()
})

/**
 * Existence check: 204 registered, 404 not. No body, because there is nothing
 * to say beyond the status — and the row's contents (p256dh, auth) are exactly
 * what must never be echoed back.
 *
 * This is the only handler whose 404 the client acts on, and it is reached
 * only after the id decoded and the account resolved — so it always means "we
 * looked and there is no such subscription", which is what makes it safe to
 * unsubscribe on.
 *
 * The client additionally requires that 404 to carry problem+json, because Next
 * answers an unrouted path with a bare 404 too. If this file moved, a
 * 404-means-false reading would unsubscribe every device on every page load.
 */
export const GET = withUser<Params>(async (_request, { userId }, { params }) => {
  const endpoint = decodePushEndpoint((await params).id)
  if (!endpoint) return invalid("Not a valid push subscription id")

  const accountId = await getDefaultAccountId(userId)
  if (accountId === null) return notFound("Push subscription")

  const exists = await subscriptionExists(accountId, endpoint)
  return exists ? noContent() : notFound("Push subscription")
})
