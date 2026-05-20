import { SymbolSearch } from "@/components/symbol-search"
import { MissedAlerts } from "@/components/alerts/missed-alerts"
import { MarketStatus } from "@/components/market/market-status"
import { MobileSidebar, type SidebarUserProps } from "@/components/sidebar"

export function Header(props: SidebarUserProps) {
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b border-border bg-card px-4 sm:gap-4 md:px-6">
      <MobileSidebar {...props} />

      <div className="flex min-w-0 flex-1 items-center md:justify-center">
        <SymbolSearch />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <MarketStatus />
        <MissedAlerts />
      </div>
    </header>
  )
}
