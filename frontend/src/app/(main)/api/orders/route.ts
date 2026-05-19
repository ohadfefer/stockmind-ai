import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account/account-service"
import { createOrder, cancelOrder } from "@/services/order-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { symbol, side, orderType, quantity, averageFillPrice, filledAt } = body

  if (!symbol || !side || !orderType || !quantity || !averageFillPrice || !filledAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)

  const orderId = await createOrder({
    accountId,
    symbol,
    side,
    orderType,
    quantity: Number(quantity),
    averageFillPrice: Number(averageFillPrice),
    filledAt,
  })

  await logAudit({
    userId,
    accountId,
    action: "order_placed",
    details: {
      orderId,
      symbol,
      side,
      orderType,
      quantity: Number(quantity),
      averageFillPrice: Number(averageFillPrice),
    },
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ orderId })
}

export async function PATCH(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orderId, status } = await request.json()
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 })
  }
  if (status !== "cancelled") {
    return NextResponse.json({ error: "Unsupported status update" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)
  await cancelOrder(Number(orderId), accountId)

  await logAudit({
    userId,
    accountId,
    action: "order_cancelled",
    details: { orderId: Number(orderId) },
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ success: true })
}
