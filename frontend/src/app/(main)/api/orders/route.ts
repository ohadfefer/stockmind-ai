import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account/account-service"
import { createOrder, cancelOrder } from "@/services/order-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"
import { SYMBOL_RE } from "@/lib/symbol"

/** Mirrors the order_type CHECK constraint in migration 004. */
const ORDER_TYPES = ["market", "limit", "stop", "stop_limit"]

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

  // Everything below is validated server-side because the trade forms are not a
  // trust boundary: the quantity on the desktop flow comes from a URL search
  // param, and any of these fields can be set directly against this endpoint
  // with a session cookie. A negative quantity in particular inverts the cash
  // sign in recordTradeSettlement and credits the account.
  const normalizedSymbol = String(symbol).trim().toUpperCase()
  if (!SYMBOL_RE.test(normalizedSymbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 })
  }

  if (side !== "buy" && side !== "sell") {
    return NextResponse.json({ error: "side must be 'buy' or 'sell'" }, { status: 400 })
  }

  if (!ORDER_TYPES.includes(orderType)) {
    return NextResponse.json(
      { error: `orderType must be one of: ${ORDER_TYPES.join(", ")}` },
      { status: 400 },
    )
  }

  const parsedQuantity = Number(quantity)
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return NextResponse.json({ error: "quantity must be a positive number" }, { status: 400 })
  }

  const parsedFillPrice = Number(averageFillPrice)
  if (!Number.isFinite(parsedFillPrice) || parsedFillPrice <= 0) {
    return NextResponse.json(
      { error: "averageFillPrice must be a positive number" },
      { status: 400 },
    )
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)

  const orderId = await createOrder({
    accountId,
    symbol: normalizedSymbol,
    side,
    orderType,
    quantity: parsedQuantity,
    averageFillPrice: parsedFillPrice,
    filledAt,
  })

  await logAudit({
    userId,
    accountId,
    action: "order_placed",
    details: {
      orderId,
      symbol: normalizedSymbol,
      side,
      orderType,
      quantity: parsedQuantity,
      averageFillPrice: parsedFillPrice,
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
