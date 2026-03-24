"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"

export default function OnboardingPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = fullName.trim()
    if (!trimmed) {
      setError("Please enter your full name")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/insert-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: trimmed }),
      })

      if (!res.ok) {
        throw new Error("Failed to save name")
      }

      router.push("/dashboard")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Zap className="size-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">StockMind AI</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          One last step to get started
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            What&apos;s your name?
          </h2>
          <p className="text-sm text-muted-foreground">
            This will be displayed in your profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-foreground"
            >
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoFocus
              className="flex w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  )
}
