import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account/account-service"
import { createExecution } from "@/services/execution-service"
import { claimPendingOrder, getPendingOrder } from "@/services/order-service"
import { recordTradeSettlement } from "@/services/cash-ledger-service"
import { updatePosition } from "@/services/position/position-service"
import { finnhubFetch } from "@/lib/finnhub"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // orderId is the only input taken from the caller. symbol, side and quantity
  // are read from the order row instead, because the request body cannot be
  // trusted to describe the order it claims to settle — a negative quantity
  // here used to invert the sign in recordTradeSettlement and credit the
  // account. The order row has already been validated on creation and is
  // backed by CHECK constraints (migration 028).
  const { orderId } = await request.json()

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 })
  }

  const id = Number(orderId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "orderId must be a positive integer" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)

  // Scoped to this account, so another user's orderId reads as "not pending"
  // rather than leaking whether it exists.
  const pending = await getPendingOrder(id, accountId)
  if (!pending) {
    return NextResponse.json({ error: "Order is not pending" }, { status: 409 })
  }

  const quote = (await finnhubFetch("/quote", { symbol: pending.symbol })) as { c: number }
  if (!quote || !quote.c) {
    return NextResponse.json({ error: "Unable to fetch current price" }, { status: 502 })
  }

  // The claim is the real gate: the read above can go stale, so if a concurrent
  // request claimed the order in between, this returns null and nothing settles.
  const order = await claimPendingOrder(id, accountId, quote.c)
  if (!order) {
    return NextResponse.json({ error: "Order is not pending" }, { status: 409 })
  }

  const commission = 2.0
  const fees = 0.5

  const executionId = await createExecution({
    orderId: id,
    accountId,
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    price: quote.c,
  })

  await recordTradeSettlement({
    accountId,
    executionId,
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    price: quote.c,
    commission,
    fees,
  })

  await updatePosition({
    accountId,
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    price: quote.c,
    commission,
    fees,
  })

  await logAudit({
    userId,
    accountId,
    action: "order_executed",
    details: {
      orderId: id,
      executionId,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      fillPrice: quote.c,
    },
    ipAddress: getClientIp(request),
  })

  return NextResponse.json({ executionId })
}
