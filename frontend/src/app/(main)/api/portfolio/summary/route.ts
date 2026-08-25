import { NextResponse } from "next/server"
import { withUser } from "@/lib/http/with-auth"
import { getAccountDetails } from "@/services/account/account-service"
import { getPortfolioSummary } from "@/services/portfolio/portfolio-service"

/**
 * withUser + getAccountDetails rather than withAccount: the summary needs the
 * cash balance as well as the account id, and getAccountDetails resolves both
 * in one call — withAccount would provision the account and then this would
 * provision it again. Same pairing as the conversation turn routes.
 *
 * The old handler's `if (!account) return 404` was unreachable:
 * getAccountDetails returns AccountDetails, not AccountDetails | null.
 */
export const GET = withUser(async (_request, { userId }) => {
  const account = await getAccountDetails(userId)
  return NextResponse.json(
    await getPortfolioSummary(account.id, account.running_balance),
  )
})
