import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// Overrides the parent portfolio/loading.tsx for this segment, so navigating
// to Orders shows an orders-shaped fallback instead of the holdings skeleton.
// The header is static, so it renders for real — the back link works while
// the table is still loading.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/portfolio"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Portfolio
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your trade orders
        </p>
      </div>

      <div className="animate-pulse rounded-xl border border-border bg-card">
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-secondary" />
          ))}
        </div>
      </div>
    </div>
  )
}
