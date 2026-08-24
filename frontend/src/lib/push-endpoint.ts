/**
 * A push subscription is identified by base64url of its endpoint URL.
 *
 * A hash was the obvious alternative and it is worse here on two counts: it
 * needs a new column and a migration before the row can be looked up, and it
 * is one-way, so the host allowlist below could never run again once the
 * endpoint left the client. base64url needs neither — the endpoint decodes
 * straight back out, and every check the old body-carried endpoint got still
 * applies. An endpoint is ~270 characters, so the id is ~360, comfortably
 * inside one URL path segment.
 */

/**
 * Push services we will store an endpoint for. Without this, the endpoint is
 * an attacker-supplied URL that a logged-in user can persist and that
 * web-push will later POST to from inside our network — an SSRF primitive
 * with a scheduler attached.
 */
const ALLOWED_PUSH_HOSTS = [
  "fcm.googleapis.com",
  ".push.services.mozilla.com",
  ".notify.windows.com",
  ".push.apple.com",
]

function isValidPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint)
    if (url.protocol !== "https:") return false
    return ALLOWED_PUSH_HOSTS.some((host) =>
      host.startsWith(".") ? url.hostname.endsWith(host) : url.hostname === host,
    )
  } catch {
    return false
  }
}

/**
 * Decodes a subscription id back to its endpoint, or null if it isn't one.
 *
 * The re-encode comparison is not belt-and-braces. Buffer's base64url decoder
 * is lenient: it silently drops characters it doesn't recognise instead of
 * failing, so without the round trip a mistyped id would decode to some
 * shorter string, and several distinct ids would name the same subscription —
 * the one thing an identifier may not do.
 */
export function decodePushEndpoint(id: string): string | null {
  const endpoint = Buffer.from(id, "base64url").toString("utf8")
  if (Buffer.from(endpoint, "utf8").toString("base64url") !== id) return null
  return isValidPushEndpoint(endpoint) ? endpoint : null
}
