import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { saveSubscription, deleteSubscription } from "@/services/push-subscription-service"

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

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { endpoint, p256dh, auth } = await request.json()
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Missing subscription fields" }, { status: 400 })
  }

  if (!isValidPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  await saveSubscription(userId, endpoint, p256dh, auth)
  return NextResponse.json({ saved: true })
}

export async function DELETE(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { endpoint } = await request.json()
  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  await deleteSubscription(userId, endpoint)
  return NextResponse.json({ deleted: true })
}
