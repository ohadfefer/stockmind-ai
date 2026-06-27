import Image from "next/image"
import { redirect } from "next/navigation"
import { BarChart3, Brain, TrendingUp } from "lucide-react"
import { auth0 } from "@/lib/auth0"

export default async function LandingPage() {
  // Public front door. Logged-in users skip the marketing splash and go
  // straight to the dashboard.
  const session = await auth0.getSession()
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/icons/icon-192x192.png"
          alt="StockMind AI"
          width={96}
          height={96}
          className="h-24 w-24"
          priority
        />
        <h1 className="text-4xl font-bold tracking-tight">StockMind AI</h1>
        <p className="text-muted-foreground max-w-md text-lg">
          AI-powered stock research and analysis at your fingertips.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-lg border p-6">
          <TrendingUp className="text-primary h-8 w-8" />
          <h3 className="font-semibold">Live Market Data</h3>
          <p className="text-muted-foreground text-sm">Real-time quotes and sector performance</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border p-6">
          <BarChart3 className="text-primary h-8 w-8" />
          <h3 className="font-semibold">Portfolio Tracking</h3>
          <p className="text-muted-foreground text-sm">Monitor your holdings and returns</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border p-6">
          <Brain className="text-primary h-8 w-8" />
          <h3 className="font-semibold">AI Insights</h3>
          <p className="text-muted-foreground text-sm">Smart analysis and recommendations</p>
        </div>
      </div>

      {/* Auth CTAs. Plain anchors (not next/link) because /auth/* is handled by
          the Auth0 middleware, not the App Router — these need a real navigation. */}
      <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <a
          href="/auth/login?returnTo=/dashboard"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Log in
        </a>
        <a
          href="/auth/login?screen_hint=signup&returnTo=/onboarding"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          Sign up
        </a>
      </div>
    </div>
  )
}
