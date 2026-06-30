import { redirect } from "next/navigation"
import { BarChart3, Brain, TrendingUp } from "lucide-react"
import { auth0 } from "@/lib/auth0"
import { DemoLogin } from "@/components/landing/demo-login"
import { LandingHero } from "@/components/landing/landing-hero"
import { Button } from "@/components/ui/button"

export default async function LandingPage() {
  // Public front door. Logged-in users skip the marketing splash and go
  // straight to the dashboard.
  const session = await auth0.getSession()
  if (session) {
    redirect("/dashboard")
  }

  const features = [
    {
      icon: TrendingUp,
      title: "Live Market Data",
      description: "Real-time quotes and sector performance",
    },
    {
      icon: BarChart3,
      title: "Portfolio Tracking",
      description: "Monitor your holdings and returns",
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "Smart analysis and recommendations",
    },
  ]

  return (
    <main className="relative grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-[2fr_3fr]">
      {/* App logo — pinned to the page's top-left corner. No tile: the
          background is the page background, so only the horns (text-foreground
          strokes) are visible. */}
      <div className="absolute left-6 top-6 z-20 hidden lg:block">
        <svg
          viewBox="0 0 512 512"
          className="size-12 text-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth={16}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M 220,300 Q 200,260 170,220 Q 130,165 95,150 Q 70,140 60,160" />
          <path d="M 292,300 Q 312,260 342,220 Q 382,165 417,150 Q 442,140 452,160" />
          <path d="M 220,300 Q 256,315 292,300" />
          <circle cx="256" cy="355" r="40" />
        </svg>
      </div>

      {/* LEFT: auth card */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">
          {/* Brand */}
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">StockMind AI</h1>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground text-pretty">
              AI-powered stock research and analysis at your fingertips.
            </p>
          </div>

          {/* Auth CTAs. Plain anchors (not next/link) because /auth/* is handled
              by the Auth0 middleware, not the App Router — these need a real
              browser navigation. */}
          <div className="mt-8 flex flex-col gap-3">
            <Button asChild className="w-full">
              <a href="/auth/login?returnTo=/dashboard">Log in</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/auth/login?screen_hint=signup&returnTo=/onboarding">
                Sign up
              </a>
            </Button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>

          {/* Self-contained client component */}
          <div className="flex justify-center">
            <DemoLogin />
          </div>

          {/* Feature highlights */}
          <ul className="mt-8 flex flex-col gap-3 border-t border-border pt-6">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* RIGHT: animated hero (hidden on small screens) */}
      <LandingHero />
    </main>
  )
}
