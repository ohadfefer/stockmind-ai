import webpush from "web-push"
import type { PushSubscriptionRecord } from "@/services/push-subscription-service"

webpush.setVapidDetails(
  "mailto:noreply@stockmind.ai",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: { title: string; body: string; url?: string },
) {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    JSON.stringify(payload),
  )
}
