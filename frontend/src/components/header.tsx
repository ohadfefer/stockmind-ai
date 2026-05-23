import { SymbolSearch } from "@/components/symbol-search"
import { MobileSymbolSearch } from "@/components/mobile/mobile-symbol-search"
import { MissedAlerts } from "@/components/alerts/missed-alerts"
import { MarketStatus } from "@/components/market/market-status"
import { MobileSidebar, type SidebarUserProps } from "@/components/sidebar"

export function Header(props: SidebarUserProps) {
  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b border-border bg-card px-4 sm:gap-4 md:px-6">
      <MobileSidebar {...props} />

      {/* Inline search — desktop/tablet only; collapses to an icon on mobile. */}
      <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
        <SymbolSearch />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        <MobileSymbolSearch />
        {/* Divider between the mobile search icon and the actions beside it. */}
        <div aria-hidden className="h-5 w-px shrink-0 bg-border md:hidden" />
        {/* Market status pill takes too much room on phones. */}
        <div className="hidden sm:flex">
          <MarketStatus />
        </div>
        <MissedAlerts />
      </div>
    </header>
  )
}
