"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

const STEPS = [
  {
    title: "$3+ Billion in connected assets and growing",
    description:
      "Join thousands of investors securely connected through Plaid or by manually uploading statements.",
  },
  {
    title: "Most investors link 2 or more accounts",
    description:
      "From retirement accounts to brokerages, connecting multiple accounts gives you a complete view.",
  },
  {
    title: "Take action and trade",
    description:
      "Trade directly through supported brokerages, or import traders if you prefer another platform.",
  },
]

export default function ConnectIntroPage() {
  const router = useRouter()

  return (
    <div className="w-full max-w-xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
        <Link
          href="/onboarding/connect/sources"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Add Accounts
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Final step — securely connect your accounts
        </h1>
        <p className="text-sm text-muted-foreground">
          Connecting your accounts helps me tailor insights to what you actually own. It&apos;s
          completely secure through Plaid, used by leading financial institutions, and takes less
          than a minute.
        </p>
      </div>

      <ol className="space-y-5">
        {STEPS.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        <Link
          href="/onboarding/connect/sources"
          className="flex w-full items-center justify-center rounded-lg bg-foreground px-4 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
        >
          Connect My Accounts
        </Link>
        <Link
          href="/dashboard"
          className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          I&apos;ll do it later
        </Link>
      </div>
    </div>
  )
}
