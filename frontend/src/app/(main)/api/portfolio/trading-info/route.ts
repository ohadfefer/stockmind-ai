import { auth0 } from "@/lib/auth0"
import { NextResponse } from "next/server"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getAccountDetails } from "@/services/account/account-service"
import { getPositions } from "@/services/position/position-service"

export async function GET() {
  const session = await auth0.getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const account = await getAccountDetails(userId)
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  const positions = await getPositions(account.id)

  return NextResponse.json({
    cashBalance: account.running_balance,
    positions: positions.map((p) => ({ symbol: p.symbol, quantity: p.quantity })),
  })
}
