import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getOrCreateDefaultAccount } from "@/services/account-service"
import { createExecution } from "@/services/execution-service"
import { markOrderFilled } from "@/services/order-service"
import { finnhubFetch } from "@/lib/finnhub"

export async function POST(request: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orderId, symbol, side, quantity } = await request.json()

  if (!orderId || !symbol || !side || !quantity) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const accountId = await getOrCreateDefaultAccount(userId)

  const quote = await finnhubFetch("/quote", { symbol }) as { c: number }
  if (!quote || !quote.c) {
    return NextResponse.json({ error: "Unable to fetch current price" }, { status: 502 })
  }

  const executionId = await createExecution({
    orderId: Number(orderId),
    accountId,
    symbol,
    side,
    quantity: Number(quantity),
    price: quote.c,
  })

  await markOrderFilled(Number(orderId), accountId, quote.c)

  return NextResponse.json({ executionId })
}
