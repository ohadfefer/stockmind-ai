import { UserRound } from "lucide-react"
import { SettingsPlaceholder } from "@/components/settings/settings-placeholder"
import { SettingsSubPage } from "@/components/settings/settings-sub-page"

export default function AccountsSettingsPage() {
  return (
    <SettingsSubPage>
      <SettingsPlaceholder
        title="Accounts"
        description="Manage your linked accounts and profile."
        icon={UserRound}
      />
    </SettingsSubPage>
  )
}
