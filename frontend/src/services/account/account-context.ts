import { auth0 } from "@/lib/auth0"
import { getDb } from "@/lib/db"
import {
  getAccountDetails,
  type AccountDetails,
} from "@/services/account/account-service"

export interface AccountContext {
  userId: number
  accountId: number
  runningBalance: number
}

/**
 * The auth session → app user id → default account chain behind both views
 * below. Returns null only when there is no session or no app user (a
 * genuinely logged-out / un-provisioned state). A user without an account gets
 * one provisioned, so there is no null-account path. A database failure
 * rejects rather than reading as a missing user, so callers render their error
 * state instead of a legitimate-looking empty portfolio.
 */
async function resolveUserAccount(): Promise<
  { userId: number; account: AccountDetails } | null
> {
  const session = await auth0.getSession()
  if (!session) return null

  // User, default account and balance in one round trip instead of three —
  // each one crosses the Atlantic to Neon. The LEFT JOIN keeps the user row
  // when there is no account, so "no app user" (no row) stays distinct from
  // "user without an account" (null account_id). The account and balance
  // rules match getAccountDetails.
  const sql = getDb()
  const rows = await sql`
    SELECT u.id AS user_id,
           a.id AS account_id,
           a.account_number,
           a.currency,
           a.status,
           COALESCE(
             (SELECT running_balance FROM cash_ledger
              WHERE account_id = a.id
                AND id = (SELECT MAX(id) FROM cash_ledger WHERE account_id = a.id)),
             0
           ) AS running_balance
    FROM users u
    LEFT JOIN LATERAL (
      SELECT id, account_number, currency, status FROM accounts
      WHERE user_id = u.id AND status = 'active'
      ORDER BY opened_at
      LIMIT 1
    ) a ON true
    WHERE u.auth0_id = ${session.user.sub}
  `

  const row = rows[0]
  if (!row) return null
  const userId = row.user_id as number

  if (row.account_id == null) {
    return { userId, account: await getAccountDetails(userId) }
  }

  return {
    userId,
    account: {
      id: row.account_id as number,
      account_number: row.account_number as string,
      currency: row.currency as string,
      status: row.status as string,
      running_balance: Number(row.running_balance),
    },
  }
}

/**
 * Single source of truth for "who is the user and which account are we acting
 * on" — the ids and cash balance most pages key their queries on.
 */
export async function resolveAccountContext(): Promise<AccountContext | null> {
  const resolved = await resolveUserAccount()
  if (!resolved) return null
  return {
    userId: resolved.userId,
    accountId: resolved.account.id,
    runningBalance: resolved.account.running_balance,
  }
}

/**
 * The same lookup, returning the full account row — the account page shows
 * the account number and currency, which the context above doesn't carry.
 */
export async function resolveAccountDetails(): Promise<AccountDetails | null> {
  const resolved = await resolveUserAccount()
  return resolved?.account ?? null
}
