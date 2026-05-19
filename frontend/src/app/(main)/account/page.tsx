import { loadAccountPageData } from "@/services/account/account-page-data"
import { parseAccountTab } from "@/components/account/account-tabs"
import { AccountContent } from "@/components/account/account-content"

interface AccountPageProps {
  searchParams: Promise<{ tab?: string }>
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { tab } = await searchParams
  const data = loadAccountPageData(parseAccountTab(tab))

  return <AccountContent {...data} />
}
