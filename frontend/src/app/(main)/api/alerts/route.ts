import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account-service"
import { getAlerts, createAlert, deleteAlert, type AlertCondition } from "@/services/alerts/alerts-service"

const validConditions: AlertCondition[] = ["price_above", "price_below", "earnings", "ai_signal"]

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
  const alerts = await getAlerts(accountId)

  return NextResponse.json({ alerts })
}

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { symbol, condition, targetValue } = await request.json()

  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }
  if (!validConditions.includes(condition)) {
    return NextResponse.json({ error: "Invalid condition" }, { status: 400 })
  }
  if (typeof targetValue !== "number" || targetValue <= 0) {
    return NextResponse.json({ error: "targetValue must be a positive number" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)
  const alert = await createAlert(accountId, symbol.toUpperCase(), condition, targetValue)

  return NextResponse.json(alert, { status: 201 })
}

export async function DELETE(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { alertId } = await request.json()
  if (typeof alertId !== "number") {
    return NextResponse.json({ error: "alertId is required" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)
  const ok = await deleteAlert(accountId, alertId)
  if (!ok) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 })
  }

  return NextResponse.json({ deleted: true })
}
