import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account-service"
import { getAlerts, createAlert, deleteAlert, isValidSymbol, type AlertCondition } from "@/services/alerts/alerts-service"
import { getUpcomingEarnings } from "@/services/earnings-service"

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

  if (!isValidSymbol(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })
  }
  if (!validConditions.includes(condition)) {
    return NextResponse.json({ error: "Invalid condition" }, { status: 400 })
  }

  const upperSymbol = symbol.toUpperCase()
  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  const accountId = await getOrCreateDefaultAccount(userId)

  if (condition === "earnings") {
    const upcoming = await getUpcomingEarnings(upperSymbol)
    if (!upcoming) {
      return NextResponse.json(
        { error: "No upcoming earnings date found for this symbol" },
        { status: 422 },
      )
    }
    const alert = await createAlert(accountId, upperSymbol, condition, null, upcoming.date)
    return NextResponse.json(alert, { status: 201 })
  }

  if (typeof targetValue !== "number" || targetValue <= 0) {
    return NextResponse.json({ error: "targetValue must be a positive number" }, { status: 400 })
  }

  const alert = await createAlert(accountId, upperSymbol, condition, targetValue)
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
