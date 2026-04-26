import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { PaymentsSettings } from "@/components/settings/payments"
import { getSubscriptionForAuth0Id } from "@/services/stripe/subscription-service"

export default async function PaymentsSettingsPage() {
  const session = await auth0.getSession()
  if (!session) redirect("/auth/login")

  const subscription = await getSubscriptionForAuth0Id(session.user.sub)

  return (
    <Suspense fallback={null}>
      <PaymentsSettings subscription={subscription} />
    </Suspense>
  )
}
