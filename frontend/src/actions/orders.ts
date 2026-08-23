import { apiFetch, apiSend, json } from "@/actions/http"

export interface SubmitOrderParams {
  symbol: string
  side: "buy" | "sell"
  orderType: string
  quantity: number
  averageFillPrice: number
  filledAt: string
}

export function submitOrder(params: SubmitOrderParams): Promise<{ id: number }> {
  return apiFetch<{ id: number }>("/api/orders", {
    method: "POST",
    ...json(params),
  })
}

/**
 * Cancellation is a status transition on the order, not a delete — the row
 * stays and lands in a terminal state. A 409 here means it stopped being
 * pending, which in practice means it filled first.
 */
export function cancelOrder(orderId: number): Promise<void> {
  return apiSend(`/api/orders/${orderId}`, {
    method: "PATCH",
    ...json({ status: "cancelled" }),
  })
}

/**
 * Settling the order creates an execution under it. The id is the whole
 * request — symbol, side and quantity used to ride along in the body and were
 * never read, since the server takes those from the order row.
 */
export function executeOrder(orderId: number): Promise<void> {
  return apiSend(`/api/orders/${orderId}/executions`, { method: "POST" })
}
