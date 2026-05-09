import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account-service"
import { getTransferCooldown } from "@/services/transfer-service"

export async function GET() {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)
  const cooldown = await getTransferCooldown(accountId)
  return NextResponse.json(cooldown)
}
