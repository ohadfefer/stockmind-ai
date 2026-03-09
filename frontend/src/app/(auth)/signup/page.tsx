import Link from "next/link"
import { Zap } from "lucide-react"

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Zap className="size-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">StockMind AI</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered stock research & analysis
        </p>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-card p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Create your account
          </h2>
          <p className="text-sm text-muted-foreground">
            Get started with StockMind AI for free
          </p>
        </div>

        <a
          href="/auth/login?screen_hint=signup&returnTo=/onboarding"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign up with Auth0
        </a>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
