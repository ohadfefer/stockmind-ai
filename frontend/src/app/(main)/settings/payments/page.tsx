import { Suspense } from "react"
import { PaymentsSettings } from "@/components/settings/payments"
import { SettingsSubPage } from "@/components/settings/settings-sub-page"

export default function PaymentsSettingsPage() {
  return (
    <SettingsSubPage>
      <Suspense fallback={null}>
        <PaymentsSettings />
      </Suspense>
    </SettingsSubPage>
  )
}
