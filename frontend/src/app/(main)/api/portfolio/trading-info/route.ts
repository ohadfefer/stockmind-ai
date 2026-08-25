import { NextResponse } from "next/server"
import { withUser } from "@/lib/http/with-auth"
import { getAccountDetails } from "@/services/account/account-service"
import { getPositions } from "@/services/position/position-service"

/**
 * Cash + share counts for the trade form's affordability checks. withUser +
 * getAccountDetails for the same reason as /api/portfolio/summary.
 */
export const GET = withUser(async (_request, { userId }) => {
  const account = await getAccountDetails(userId)
  const positions = await getPositions(account.id)

  return NextResponse.json({
    cashBalance: account.running_balance,
    positions: positions.map((p) => ({ symbol: p.symbol, quantity: p.quantity })),
  })
})
