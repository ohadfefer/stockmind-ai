import { NextResponse } from "next/server"
import { withAccount } from "@/lib/http/with-auth"
import { conflict, invalid, notFound } from "@/lib/http/problem"
import { cancelOrder } from "@/services/order-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

type Params = { id: string }

/**
 * PATCH only. No GET: /portfolio/orders reads the list server-side, so a
 * single-order fetch would be surface nothing calls. The Location header on
 * POST /api/orders still points here — it identifies the order, which is all
 * Location promises, and this is the URL that acts on it.
 *
 * Cancellation is a status transition rather than a DELETE because the order
 * survives it: cancelled is a terminal state on the row, not a removal.
 */
export const PATCH = withAccount<Params>(
  async (request, { userId, accountId }, { params }) => {
    const orderId = Number((await params).id)
    if (!Number.isInteger(orderId) || orderId <= 0) return notFound("Order")

    const body = (await request.json().catch(() => null)) as { status?: unknown } | null
    if (body?.status !== "cancelled") {
      return invalid('status must be "cancelled" — the only supported transition')
    }

    // 409 rather than 404 for every miss, including an id that doesn't exist
    // or isn't this account's. Splitting them would answer "does this id
    // exist" for ids the caller doesn't own, and 409 is the useful answer for
    // the case that actually happens: cancelling an order that just filled.
    const cancelled = await cancelOrder(orderId, accountId)
    if (!cancelled) {
      return conflict(
        "order_not_pending",
        "The order is no longer pending, so it cannot be cancelled.",
      )
    }

    await logAudit({
      userId,
      accountId,
      action: "order_cancelled",
      details: { orderId },
      ipAddress: getClientIp(request),
    })

    return NextResponse.json({ id: orderId, status: "cancelled" })
  },
)
