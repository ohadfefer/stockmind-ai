"use client"

import { Suspense, use } from "react"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import { PaymentsSettings } from "@/components/settings/subscription/payments"
import type {
  PaymentsData,
  PaymentsPageData,
} from "@/services/stripe/payments-page-data"

export function PaymentsContent({ dataPromise }: PaymentsPageData) {
  return (
    <ErrorBoundary
      resetKeys={[dataPromise]}
      fallback={
        <SectionError
          title="Couldn't load billing"
          description="We couldn't fetch your subscription right now."
        />
      }
    >
      {/* Also satisfies the Suspense boundary PaymentsSettings needs for
          useSearchParams (the page's previous <Suspense fallback={null}>). */}
      <Suspense fallback={<PaymentsSkeleton />}>
        <PaymentsSection dataPromise={dataPromise} />
      </Suspense>
    </ErrorBoundary>
  )
}

function PaymentsSection({
  dataPromise,
}: {
  dataPromise: Promise<PaymentsData>
}) {
  const { subscription, paymentMethod, invoices } = use(dataPromise)
  return (
    <PaymentsSettings
      subscription={subscription}
      paymentMethod={paymentMethod}
      invoices={invoices}
    />
  )
}

// Approximates a plan card (FreePlan / SubscriberPlan share the same shell:
// a header block plus a couple of detail rows in a bordered card).
function PaymentsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-1">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-40 rounded bg-secondary" />
          <div className="h-8 w-32 rounded-lg bg-secondary" />
        </div>
        <div className="h-4 w-3/4 rounded bg-secondary" />
        <div className="mt-2 flex flex-col gap-3">
          <div className="h-4 w-1/2 rounded bg-secondary" />
          <div className="h-4 w-2/3 rounded bg-secondary" />
          <div className="h-4 w-1/3 rounded bg-secondary" />
        </div>
      </div>
    </div>
  )
}
