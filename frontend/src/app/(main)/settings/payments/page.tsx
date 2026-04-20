import { CreditCard } from "lucide-react"
import { SettingsPlaceholder } from "@/components/settings/settings-placeholder"
import { SettingsSubPage } from "@/components/settings/settings-sub-page"

export default function PaymentsSettingsPage() {
  return (
    <SettingsSubPage>
      <SettingsPlaceholder
        title="Payments"
        description="Manage payment methods and billing."
        icon={CreditCard}
      />
    </SettingsSubPage>
  )
}
