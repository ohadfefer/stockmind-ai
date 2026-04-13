export interface SubmitOrderParams {
  symbol: string
  side: "buy" | "sell"
  orderType: string
  quantity: number
  averageFillPrice: number
  filledAt: string
}

export async function submitOrder(params: SubmitOrderParams): Promise<{ orderId: number }> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error("Failed to submit order")
  return res.json()
}

export interface ExecuteOrderParams {
  orderId: number
  symbol: string
  side: "buy" | "sell"
  quantity: number
}

export async function cancelOrder(orderId: number): Promise<void> {
  const res = await fetch("/api/orders", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, status: "cancelled" }),
  })
  if (!res.ok) throw new Error("Failed to cancel order")
}

export async function executeOrder(params: ExecuteOrderParams): Promise<{ executionId: number }> {
  const res = await fetch("/api/orders/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error("Failed to execute order")
  return res.json()
}
