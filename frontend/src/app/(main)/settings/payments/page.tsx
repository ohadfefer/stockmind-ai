import { Suspense } from "react"
import { PaymentsSettings } from "@/components/settings/payments"

export default function PaymentsSettingsPage() {
  return (
    <Suspense fallback={null}>
      <PaymentsSettings />
    </Suspense>
  )
}
