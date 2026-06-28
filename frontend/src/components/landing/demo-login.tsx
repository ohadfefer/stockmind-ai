"use client"

import { useState } from "react"
import { Check, Copy, Play } from "lucide-react"
import { toast } from "sonner"

// Shared recruiter demo account. Auth0 Universal Login can prefill the email
// via login_hint, but never the password (no such parameter, by design), so we
// surface the password here as a one-click copy.
const DEMO_EMAIL = "ohadfefer16+demo@gmail.com"
const DEMO_PASSWORD = "demouser1!"

// encodeURIComponent turns the Gmail plus-alias "+" into %2B (a bare "+" would
// be read as a space) and "@" into %40 — both safe inside a query value.
const DEMO_LOGIN_HREF = `/auth/login?login_hint=${encodeURIComponent(
  DEMO_EMAIL,
)}&returnTo=/dashboard`

export function DemoLogin() {
  const [copied, setCopied] = useState(false)

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(DEMO_PASSWORD)
      setCopied(true)
      toast.success("Password copied — paste it on the login screen")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(`Couldn't copy. Password: ${DEMO_PASSWORD}`)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {/* Plain anchor (not next/link): /auth/* is handled by the Auth0
          middleware, so this needs a real navigation. */}
      <a
        href={DEMO_LOGIN_HREF}
        className="border-primary/40 bg-primary/5 text-foreground hover:bg-primary/10 flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors"
      >
        <Play className="h-4 w-4" />
        Explore the live demo
      </a>

      <p className="text-muted-foreground text-xs">
        Email is pre-filled. Use password{" "}
        <button
          type="button"
          onClick={copyPassword}
          className="bg-muted text-foreground hover:bg-muted/80 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono transition-colors"
        >
          {DEMO_PASSWORD}
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>{" "}
        to sign in.
      </p>
    </div>
  )
}
