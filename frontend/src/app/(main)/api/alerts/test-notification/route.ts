import { NextResponse } from "next/server"
import { withAccount } from "@/lib/http/with-auth"
import { unprocessable } from "@/lib/http/problem"
import { getSubscriptionsForAccount } from "@/services/push-subscription-service"
import { sendPushNotification } from "@/services/notification-service"

/**
 * The API's one deliberate RPC exception: an action, not a resource. There is
 * no "test notification" entity to create, and nothing in the app calls this —
 * it exists to be hit with curl when verifying that a device's push
 * registration actually delivers, which is otherwise only observable by
 * waiting for a real alert to trigger.
 *
 * withAccount because the subscriptions hang off the account, and a caller
 * testing push has an account by definition.
 */
export const POST = withAccount(async (_request, { accountId }) => {
  const subscriptions = await getSubscriptionsForAccount(accountId)
  if (subscriptions.length === 0) {
    // 422, not 404: the route exists and the request was well formed, there is
    // just nothing registered to send to. Same shape as no_upcoming_earnings.
    return unprocessable(
      "no_push_subscriptions",
      "This account has no registered push subscriptions.",
    )
  }

  const payload = {
    title: "AAPL Alert Triggered",
    body: "AAPL is now $198.50 — hit your above target of $195.00",
    url: "/details/aapl",
  }

  // Individually caught so one dead subscription does not suppress delivery to
  // the caller's other devices — the point of the endpoint is to see which
  // ones arrive.
  await Promise.all(
    subscriptions.map((sub) =>
      sendPushNotification(sub, payload).catch((err) => {
        console.error(`[test-notification] Push failed for subscription ${sub.id}:`, err)
      }),
    ),
  )

  return NextResponse.json({ sent: subscriptions.length })
})
