import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import {
  getAccountDetails,
  getAccountHistory,
  type AccountDetails,
  type HistoryEntry,
} from "@/services/account-service"
import {
  getPortfolioDailyValues,
  type PortfolioDailyValue,
} from "@/services/position/portfolio-daily-value-service"
import type { AccountTab } from "@/components/account/account-tabs"

export interface AccountPageData {
  tab: AccountTab
  accountPromise: Promise<AccountDetails | null>
  // Non-null only for the tab actually being rendered. The tab is known
  // server-side from the URL, so creating the other tabs' promises would
  // both fire queries no one reads and leave a rejected promise with no
  // consumer (a floating unhandled rejection) when that tab's fetch fails.
  historyPromise: Promise<HistoryEntry[]> | null
  dailyValuesPromise: Promise<PortfolioDailyValue[]> | null
}

// Logs with context (so the server retains the real error) then rethrows so
// the promise still rejects and the section error boundary renders a
// retryable state. We deliberately do NOT swallow into empties: a transient
// DB failure must surface as an error, not as a legitimate-looking empty
// account. The only "empty" path is a genuine logged-out state (null
// account), handled inline below.
function logAndRethrow(label: string) {
  return (err: unknown): never => {
    console.error(`${label}:`, err)
    throw err
  }
}

// Resolves the auth session → app user → account chain. Returns null only
// when there is no session or no app user (a genuinely logged-out state).
// We resolve the full AccountDetails here rather than via the shared
// resolveAccountContext() because the account page needs currency/status,
// which that helper doesn't expose — routing through it would just re-fetch
// getAccountDetails a second time.
async function resolveAccount(): Promise<AccountDetails | null> {
  const session = await auth0.getSession()
  if (!session) return null
  const userId = await getUserIdByAuth0Id(session.user.sub)
  if (!userId) return null
  return getAccountDetails(userId)
}

/**
 * Kicks off account data fetching without blocking the page render. The tab
 * bar always needs the account, so that resolves once and is shared. Only
 * the active tab's data promise is created — the tab is known server-side
 * from the URL, so the other tabs' queries are never fired and can't leave
 * an unconsumed rejected promise. Each section still streams under its own
 * Suspense boundary.
 */
export function loadAccountPageData(tab: AccountTab): AccountPageData {
  const accountPromise = resolveAccount().catch(
    logAndRethrow("account details failed"),
  )

  const historyPromise =
    tab === "history"
      ? accountPromise.then((account) =>
          account
            ? getAccountHistory(account.id).catch(
                logAndRethrow("account history failed"),
              )
            : [],
        )
      : null

  const dailyValuesPromise =
    tab === "performance"
      ? accountPromise.then((account) =>
          account
            ? getPortfolioDailyValues(account.id).catch(
                logAndRethrow("portfolio daily values failed"),
              )
            : [],
        )
      : null

  return { tab, accountPromise, historyPromise, dailyValuesPromise }
}
