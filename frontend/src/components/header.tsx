import { SymbolSearch } from "@/components/symbol-search"
import { MissedAlerts } from "@/components/alerts/missed-alerts"
import { MarketStatus } from "@/components/market/market-status"

export function Header() {
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-1 items-center justify-center">
        <SymbolSearch />
      </div>

      <div className="flex items-center gap-4">
        <MarketStatus />
        <MissedAlerts />
      </div>
    </header>
  )
}
