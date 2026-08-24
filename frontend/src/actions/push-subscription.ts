import { apiRequest, apiSend, json } from "@/actions/http"

/**
 * The subscription's id is base64url of its endpoint, which is what makes it
 * addressable at a URL — see lib/push-endpoint.ts for the server half.
 *
 * btoa is byte-oriented and throws on anything outside latin1. A push endpoint
 * is an https URL, so it is ASCII by construction and this is safe; the same
 * assumption the two getKey() calls below already make.
 */
function subscriptionPath(endpoint: string): string {
  const id = btoa(endpoint).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  return `/api/push-subscriptions/${id}`
}

function toBase64(key: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(key)))
}

/**
 * PUT, not POST: the endpoint already names the resource, so registering the
 * same device twice is the same request twice rather than a second row. 201
 * and 204 both mean success here, which is why this is apiSend.
 */
export async function subscribePush(subscription: PushSubscription) {
  const key = subscription.getKey("p256dh")
  const auth = subscription.getKey("auth")
  if (!key || !auth) throw new Error("Missing subscription keys")

  await apiSend(subscriptionPath(subscription.endpoint), {
    method: "PUT",
    ...json({ p256dh: toBase64(key), auth: toBase64(auth) }),
  })
}

/**
 * Tri-state on purpose. use-notifications treats `false` as authority to call
 * sub.unsubscribe() and destroy the local subscription, so anything short of
 * the server actually saying "no such subscription" has to come back as
 * "unknown" and leave it alone.
 *
 * That is why the 404 is checked for problem+json. Next answers an unrouted
 * path with a bare 404, so if this route were renamed, a plain
 * 404-means-not-registered reading would unsubscribe every device on every
 * mount, silently and forever. A routing mistake is not an answer.
 *
 * It also runs on mount rather than on a click, so it must not navigate on an
 * expired session — the redirect would fire on whatever page the user happens
 * to be on.
 */
export async function hasPushSubscription(
  endpoint: string,
): Promise<boolean | "unknown"> {
  try {
    const res = await apiRequest(subscriptionPath(endpoint), {
      allowStatus: [404],
      redirectOnAuthFailure: false,
    })

    if (res.status === 404) {
      const contentType = res.headers.get("content-type") ?? ""
      return contentType.includes("application/problem+json") ? false : "unknown"
    }

    return res.status === 204
  } catch {
    return "unknown"
  }
}

export function unsubscribePush(endpoint: string): Promise<void> {
  return apiSend(subscriptionPath(endpoint), { method: "DELETE" })
}
