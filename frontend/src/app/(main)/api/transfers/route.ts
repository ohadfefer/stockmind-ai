import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account-service"
import { createTransfer, resolveTransfer } from "@/services/transfer-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { direction, amount, method, description } = body

  if (!direction || !amount || !method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (Number(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)

  const transferId = await createTransfer({
    accountId,
    direction,
    amount: Number(amount),
    method,
    description: description || undefined,
  })

  const ipAddress = getClientIp(request)
  const initiatedAction = direction === "deposit" ? "deposit_initiated" : "withdrawal_initiated"
  const completedAction = direction === "deposit" ? "deposit_completed" : "withdrawal_completed"
  const auditDetails = { transferId, amount: Number(amount), method, description: description || null }

  await logAudit({
    userId,
    accountId,
    action: initiatedAction,
    details: auditDetails,
    ipAddress,
  })

  // Resolve after 10 seconds (simulate processing)
  setTimeout(async () => {
    try {
      await resolveTransfer(transferId)
      await logAudit({
        userId,
        accountId,
        action: completedAction,
        details: auditDetails,
        ipAddress,
      })
    } catch (err) {
      console.error("Failed to resolve transfer", transferId, err)
    }
  }, 10_000)

  return NextResponse.json({ transferId })
}
