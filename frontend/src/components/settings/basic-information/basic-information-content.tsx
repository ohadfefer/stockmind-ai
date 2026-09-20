"use client"

import { Suspense, use } from "react"
import { ErrorBoundary, SectionError } from "@/components/section-error"
import type { UserDetails } from "@/services/user-service"
import type { BasicInformationPageData } from "@/services/settings/basic-information-page-data"
import { DetailsForm } from "./details-form"

export function BasicInformationContent({ detailsPromise }: BasicInformationPageData) {
  return (
    <ErrorBoundary
      resetKeys={[detailsPromise]}
      fallback={
        <SectionError
          title="Couldn't load your details"
          description="We couldn't fetch your account details right now."
        />
      }
    >
      <Suspense fallback={<DetailsSkeleton />}>
        <DetailsSection detailsPromise={detailsPromise} />
      </Suspense>
    </ErrorBoundary>
  )
}

function DetailsSection({ detailsPromise }: { detailsPromise: Promise<UserDetails> }) {
  const details = use(detailsPromise)
  return <DetailsForm initialDetails={details} />
}

// Approximates the heading plus the four fields and the save button.
function DetailsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-6 w-20 rounded bg-secondary md:h-7" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-5 w-24 rounded bg-secondary md:h-6" />
            <div className="h-9 w-full rounded-md bg-secondary" />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <div className="h-9 w-32 rounded-md bg-secondary" />
      </div>
    </div>
  )
}
