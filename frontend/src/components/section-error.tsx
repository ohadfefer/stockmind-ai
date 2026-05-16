"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  fallback: React.ReactNode
  // When any key changes (by identity), a previously caught error is cleared.
  // Pass the section's data promise so a router.refresh() — which mints a new
  // promise on the server — automatically re-arms the boundary.
  resetKeys?: unknown[]
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error("section error boundary caught:", error)
  }

  componentDidUpdate(prev: ErrorBoundaryProps) {
    if (!this.state.hasError) return
    const a = prev.resetKeys ?? []
    const b = this.props.resetKeys ?? []
    if (a.length !== b.length || a.some((k, i) => !Object.is(k, b[i]))) {
      this.setState({ hasError: false })
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

export function SectionError({
  title = "Couldn't load this section",
  description = "Something went wrong fetching this data. Please try again.",
  compact = false,
}: {
  title?: string
  description?: string
  compact?: boolean
}) {
  const router = useRouter()

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card text-center ${
        compact ? "p-6" : "py-16"
      }`}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-[#EF4444]/10">
        <AlertTriangle className="size-5 text-[#EF4444]" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.refresh()}
      >
        Try again
      </Button>
    </div>
  )
}
