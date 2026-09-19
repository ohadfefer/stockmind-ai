import { loadStrategyPageData } from "@/services/settings/strategy-page-data"
import { StrategyContent } from "@/components/settings/strategy/strategy-content"

export default async function StrategySettingsPage() {
  const { profilePromise } = await loadStrategyPageData()

  return <StrategyContent profilePromise={profilePromise} />
}
