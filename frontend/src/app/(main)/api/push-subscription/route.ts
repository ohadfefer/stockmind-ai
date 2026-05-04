import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getDefaultAccountId, getOrCreateDefaultAccount } from "@/services/account-service"
import {
  saveSubscription,
  deleteSubscription,
  getSubscriptionsForAccount,
} from "@/services/push-subscription-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

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

export async function GET(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const endpoint = url.searchParams.get("endpoint")
  if (!endpoint || !isValidPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ exists: false })
  }

  const accountId = await getDefaultAccountId(userId)
  if (!accountId) {
    return NextResponse.json({ exists: false })
  }

  const subs = await getSubscriptionsForAccount(accountId)
  return NextResponse.json({ exists: subs.some((s) => s.endpoint === endpoint) })
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

  const accountId = await getOrCreateDefaultAccount(userId)
  await saveSubscription(accountId, endpoint, p256dh, auth)

  await logAudit({
    userId,
    accountId,
    action: "settings_changed",
    details: {
      setting: "push_notifications",
      enabled: true,
      endpoint,
    },
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ saved: true })
}

export async function DELETE(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { endpoint } = await request.json()
  if (!endpoint || !isValidPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)
  await deleteSubscription(accountId, endpoint)

  await logAudit({
    userId,
    accountId,
    action: "settings_changed",
    details: {
      setting: "push_notifications",
      enabled: false,
      endpoint,
    },
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ deleted: true })
}
