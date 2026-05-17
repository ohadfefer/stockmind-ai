import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getAccountDetails } from "@/services/account-service"

export interface AccountContext {
  userId: number
  accountId: number
  runningBalance: number
}

/**
 * Single source of truth for "who is the user and which account are we acting
 * on" — resolves the auth session → app user id → default account chain.
 * Returns null only when there is no session or no app user (a genuinely
 * logged-out / un-provisioned state). getAccountDetails always returns an
 * account (it provisions a default one), so there is no null-account path.
 */
export async function resolveAccountContext(): Promise<AccountContext | null> {
  const session = await auth0.getSession()
  if (!session) return null

  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) return null

  const account = await getAccountDetails(userId)
  return {
    userId,
    accountId: account.id,
    runningBalance: account.running_balance,
  }
}
