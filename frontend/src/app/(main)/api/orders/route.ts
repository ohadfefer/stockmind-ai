import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account-service"
import { createOrder, deleteOrder } from "@/services/order-service"

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

  return NextResponse.json({ orderId })
}

export async function DELETE(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orderId } = await request.json()
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)
  await deleteOrder(Number(orderId), accountId)

  return NextResponse.json({ success: true })
}
