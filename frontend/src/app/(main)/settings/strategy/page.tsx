import { Target } from "lucide-react"
import { SettingsPlaceholder } from "@/components/settings/settings-placeholder"
import { SettingsSubPage } from "@/components/settings/settings-sub-page"

export default function StrategySettingsPage() {
  return (
    <SettingsSubPage>
      <SettingsPlaceholder
        title="Strategy"
        description="Configure your trading strategy preferences."
        icon={Target}
      />
    </SettingsSubPage>
  )
}
