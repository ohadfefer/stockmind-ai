import { UserRound } from "lucide-react"
import { SettingsPlaceholder } from "@/components/settings/settings-placeholder"

export default function AccountsSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Accounts"
      description="Manage your linked accounts and profile."
      icon={UserRound}
    />
  )
}
