import { NextResponse } from "next/server"
import { withAccount } from "@/lib/http/with-auth"
import { badGateway, conflict, notFound } from "@/lib/http/problem"
import { createExecution } from "@/services/execution-service"
import { claimPendingOrder, getPendingOrder } from "@/services/order-service"
import { recordTradeSettlement } from "@/services/cash-ledger-service"
import { updatePosition } from "@/services/position/position-service"
import { finnhubFetch } from "@/lib/finnhub"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

type Params = { id: string }

/**
 * Settling an order creates an execution, so it is a POST to the order's
 * executions collection rather than a verb in the path (/api/orders/execute).
 *
 * The order id now comes from the URL and the body is ignored entirely. That
 * is not a cosmetic change: the old endpoint accepted symbol, side and
 * quantity in the body and never read them, which left three fields on the
 * wire that looked authoritative and were not.
 *
 * No Location header. The created resource is an execution, and executions
 * have no URL of their own — nothing fetches one. Pointing Location at the
 * parent order would name a different resource than the one created, so a 201
 * identified by the target URI is the honest answer (RFC 9110 §15.3.2).
 */
export const POST = withAccount<Params>(
  async (request, { userId, accountId }, { params }) => {
    const orderId = Number((await params).id)
    if (!Number.isInteger(orderId) || orderId <= 0) return notFound("Order")

    // Scoped to this account, so another user's orderId reads as "not pending"
    // rather than leaking whether it exists.
    const pending = await getPendingOrder(orderId, accountId)
    if (!pending) {
      return conflict("order_not_pending", "The order is not pending.")
    }

    const quote = (await finnhubFetch("/quote", { symbol: pending.symbol })) as { c: number }
    if (!quote || !quote.c) {
      return badGateway("Unable to fetch a current price for the order's symbol.")
    }

    // The claim is the real gate: the read above can go stale, so if a concurrent
    // request claimed the order in between, this returns null and nothing settles.
    const order = await claimPendingOrder(orderId, accountId, quote.c)
    if (!order) {
      return conflict("order_not_pending", "The order is not pending.")
    }

    const commission = 2.0
    const fees = 0.5

    const executionId = await createExecution({
      orderId,
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
        orderId,
        executionId,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        fillPrice: quote.c,
      },
      ipAddress: getClientIp(request),
    })

    return NextResponse.json({ id: executionId }, { status: 201 })
  },
)
