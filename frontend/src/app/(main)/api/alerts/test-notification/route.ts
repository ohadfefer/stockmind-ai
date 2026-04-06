import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getSubscriptionsForUser } from "@/services/push-subscription-service"
import { sendPushNotification } from "@/services/notification-service"

export async function POST() {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const subscriptions = await getSubscriptionsForUser(userId)
  if (subscriptions.length === 0) {
    return NextResponse.json({ error: "No push subscriptions found" }, { status: 404 })
  }

  const payload = {
    title: "AAPL Alert Triggered",
    body: "AAPL is now $198.50 — hit your above target of $195.00",
    url: "/details/aapl",
  }

  await Promise.all(
    subscriptions.map((sub) => sendPushNotification(sub, payload).catch(() => {})),
  )

  return NextResponse.json({ sent: subscriptions.length })
}
