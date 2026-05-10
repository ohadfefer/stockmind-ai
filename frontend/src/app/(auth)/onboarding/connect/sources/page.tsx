"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  Building2,
  Landmark,
  TrendingUp,
  CloudUpload,
  Globe,
} from "lucide-react"

const PROVIDERS = [
  {
    title: "Select from 12,000+ Institutions via Plaid",
    description: "Connect securely to your investment accounts",
    icon: Globe,
    iconBg: "bg-foreground text-background",
    href: "#",
  },
  {
    title: "Fidelity",
    description: "www.fidelity.com",
    icon: Landmark,
    iconBg: "bg-emerald-100 text-emerald-700",
    href: "#",
  },
  {
    title: "PNC Bank",
    description: "www.pnc.com",
    icon: Building2,
    iconBg: "bg-orange-100 text-orange-700",
    href: "#",
  },
  {
    title: "E*TRADE",
    description: "us.etrade.com",
    icon: TrendingUp,
    iconBg: "bg-purple-100 text-purple-700",
    href: "#",
  },
]

export default function ConnectSourcesPage() {
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
        <span className="text-muted-foreground">Connect Accounts</span>
      </div>

      <h1 className="text-2xl font-bold text-foreground">
        We have a few options to add investments:
      </h1>

      <div className="space-y-3">
        {PROVIDERS.map((p) => {
          const Icon = p.icon
          return (
            <button
              key={p.title}
              type="button"
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${p.iconBg}`}>
                <Icon className="size-5" />
              </span>
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.description}</div>
              </div>
            </button>
          )
        })}

        <Link
          href="/onboarding/connect/manual"
          className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CloudUpload className="size-5" />
          </span>
          <div className="space-y-0.5">
            <div className="text-sm font-semibold text-foreground">Manually add investments</div>
            <div className="text-xs text-muted-foreground">
              Simply upload a file, statement, or create a portfolio manually
            </div>
          </div>
        </Link>
      </div>

      <Link
        href="/dashboard"
        className="block w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        I&apos;ll do it later. Take me to the platform →
      </Link>
    </div>
  )
}
