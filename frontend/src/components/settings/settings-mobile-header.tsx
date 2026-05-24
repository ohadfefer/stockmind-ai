"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getBackTarget } from "@/lib/nav-history"

export function SettingsMobileHeader() {
  const router = useRouter()

  // Exit settings straight to the page the user came from, ignoring whatever
  // tabs they switched between inside settings.
  const handleBack = () => {
    router.push(getBackTarget())
  }

  return (
    <header className="sticky top-0 z-10 flex h-11 shrink-0 items-center border-b border-border bg-card px-2 md:hidden">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <ArrowLeft className="size-5" />
      </button>
      {/* Absolutely centered so the title sits mid-header regardless of the
          back button's width. */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-foreground">
        Settings
      </h1>
    </header>
  )
}
