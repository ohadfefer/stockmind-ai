import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { insertUser } from "@/services/user-service"
import { createDefaultAccount } from "@/services/account-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

export async function POST(request: Request) {
  const session = await auth0.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fullName } = await request.json()

  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 })
  }

  const trimmedName = fullName.trim()
  if (trimmedName.length > 50) {
    return NextResponse.json({ error: "Full name must be 50 characters or fewer" }, { status: 400 })
  }

  const { sub: auth0Id, email, picture } = session.user
  if (!email) {
    return NextResponse.json({ error: "Session missing email" }, { status: 400 })
  }

  try {
    const { userId, wasCreated } = await insertUser({
      auth0Id,
      email,
      fullName: trimmedName,
      imageUrl: picture ?? null,
    })

    if (wasCreated) {
      let accountId: number | null = null
      try {
        accountId = await createDefaultAccount(userId)
      } catch (err) {
        // Non-fatal: getOrCreateDefaultAccount will lazily create it on first action.
        console.error("Failed to create default account for user", userId, err)
      }

      await logAudit({
        userId,
        accountId,
        action: "signup",
        details: { fullName: trimmedName },
        ipAddress: getClientIp(request),
      })
    }

    return NextResponse.json({ status: "saved" })
  } catch (error) {
    console.error("Failed to save user:", error)
    return NextResponse.json(
      { error: "Failed to save user" },
      { status: 500 }
    )
  }
}
