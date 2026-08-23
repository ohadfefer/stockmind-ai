import { withAccount } from "@/lib/http/with-auth"
import { created, invalid } from "@/lib/http/problem"
import { SYMBOL_RE } from "@/lib/symbol"
import { createOrder } from "@/services/order-service"
import { logAudit } from "@/services/audit-log-service"
import { getClientIp } from "@/lib/request-ip"

/** Mirrors the order_type CHECK constraint in migration 004. */
const ORDER_TYPES = ["market", "limit", "stop", "stop_limit"]

/**
 * What `new Date().toISOString()` emits, which is what all three producers
 * send (trade/page.tsx, its confirmation page, mobile-trade-dialog). Offsets
 * are allowed so a non-UTC client isn't rejected.
 */
const ISO_8601 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/

/**
 * POST only. Cancellation moved to PATCH /api/orders/{id}, and there is no
 * collection GET because nothing fetches one: /portfolio/orders renders from
 * getOrdersByAccountId as a server component.
 */
export const POST = withAccount(async (request, { userId, accountId }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return invalid("Body must be a JSON object")

  const { symbol, side, orderType, quantity, averageFillPrice, filledAt } = body

  if (!symbol || !side || !orderType || !quantity || !averageFillPrice || !filledAt) {
    return invalid("Missing required fields")
  }

  // Everything below is validated server-side because the trade forms are not a
  // trust boundary: the quantity on the desktop flow comes from a URL search
  // param, and any of these fields can be set directly against this endpoint
  // with a session cookie. A negative quantity in particular inverts the cash
  // sign in recordTradeSettlement and credits the account.
  const normalizedSymbol = String(symbol).trim().toUpperCase()
  if (!SYMBOL_RE.test(normalizedSymbol)) {
    return invalid("Invalid symbol")
  }

  if (side !== "buy" && side !== "sell") {
    return invalid("side must be 'buy' or 'sell'")
  }

  if (typeof orderType !== "string" || !ORDER_TYPES.includes(orderType)) {
    return invalid(`orderType must be one of: ${ORDER_TYPES.join(", ")}`)
  }

  const parsedQuantity = Number(quantity)
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return invalid("quantity must be a positive number")
  }

  const parsedFillPrice = Number(averageFillPrice)
  if (!Number.isFinite(parsedFillPrice) || parsedFillPrice <= 0) {
    return invalid("averageFillPrice must be a positive number")
  }

  // filled_at is TIMESTAMPTZ (migration 004), so an unchecked value reaches
  // Postgres as a cast error and surfaces as a 500 instead of naming the bad
  // field. Date.parse alone is not the check: it reads "123" as the year 123
  // and "0" as 2000, so the shape is matched first and Date.parse then rejects
  // well-formed impossibilities like 2026-13-45.
  if (
    typeof filledAt !== "string" ||
    !ISO_8601.test(filledAt) ||
    Number.isNaN(Date.parse(filledAt))
  ) {
    return invalid("filledAt must be an ISO 8601 timestamp")
  }

  const orderId = await createOrder({
    accountId,
    symbol: normalizedSymbol,
    side,
    orderType: orderType as "market" | "limit" | "stop" | "stop_limit",
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

  return created(`/api/orders/${orderId}`, { id: orderId })
})
