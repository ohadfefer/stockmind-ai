import { auth0 } from "@/lib/auth0"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { getAccountDetails, getAccountHistory, type AccountDetails, type HistoryEntry } from "@/services/account-service"
import {
  getPortfolioDailyValues,
  type PortfolioDailyValue,
} from "@/services/position/portfolio-daily-value-service"
import { AccountTabBar } from "@/components/account/account-tab-bar"
import { AccountTabContent } from "@/components/account/account-tab-content"

export default async function AccountPage() {
  const session = await auth0.getSession()
  let account: AccountDetails | null = null
  let history: HistoryEntry[] = []
  let dailyValues: PortfolioDailyValue[] = []

  if (session) {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (userId) {
      account = await getAccountDetails(userId)
      if (account) {
        ;[history, dailyValues] = await Promise.all([
          getAccountHistory(account.id),
          getPortfolioDailyValues(account.id),
        ])
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AccountTabBar
        runningBalance={account?.running_balance ?? 0}
        currency={account?.currency ?? "USD"}
      />
      <AccountTabContent account={account} history={history} dailyValues={dailyValues} />
    </div>
  )
}
