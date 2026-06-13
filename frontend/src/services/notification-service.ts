import webpush from "web-push"
import type { PushSubscriptionRecord } from "@/services/push-subscription-service"

// Configure VAPID lazily on first send rather than at module load: web-push
// throws if the keys are absent, which would break `next build` (page-data
// collection) in environments where secrets are only injected at runtime.
let vapidConfigured = false

function configureVapid() {
  if (vapidConfigured) return
  webpush.setVapidDetails(
    "mailto:noreply@stockmind.ai",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  vapidConfigured = true
}

export type PushResult =
  | { ok: true }
  | { ok: false; gone: boolean; error: unknown }

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: { title: string; body: string; url?: string },
): Promise<PushResult> {
  try {
    configureVapid()
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    )
    return { ok: true }
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode
    return { ok: false, gone: statusCode === 404 || statusCode === 410, error: err }
  }
}
