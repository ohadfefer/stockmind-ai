import { loadPaymentsPageData } from "@/services/stripe/payments-page-data"
import { PaymentsContent } from "@/components/settings/subscription/payments-content"

export default async function PaymentsSettingsPage() {
  const { dataPromise } = await loadPaymentsPageData()

  return <PaymentsContent dataPromise={dataPromise} />
}
