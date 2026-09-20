"use client"

import { usePathname } from "next/navigation"
import { SymbolSearch } from "@/components/symbol-search"
import { MobileSymbolSearch } from "@/components/mobile/mobile-symbol-search"
import { MissedAlerts } from "@/components/alerts/missed-alerts"
import { MobileSidebar, type SidebarUserProps } from "@/components/sidebar"
import { SettingsMobileHeader } from "@/components/settings/settings-mobile-header"
import { isSettingsRoute } from "@/lib/routes"
import { cn } from "@/lib/utils"

export function Header(props: SidebarUserProps) {
  const pathname = usePathname()
  // On mobile, /settings/* gets its own back-arrow header instead of this one.
  // It's rendered here, as a sibling of <main>, rather than inside the settings
  // layout: <main> scrolls and carries padding, so a sticky header in there can
  // only pin below that padding and the page shows through above it.
  const isSettings = isSettingsRoute(pathname)

  return (
    <>
      {isSettings && <SettingsMobileHeader />}
      <header
        className={cn(
          "h-[var(--header-height)] shrink-0 items-center gap-2 border-b border-border bg-card px-4 sm:gap-4 md:px-6",
          isSettings ? "hidden md:flex" : "flex",
        )}
      >
        <MobileSidebar {...props} />

        {/* Inline search — desktop/tablet only; collapses to an icon on mobile. */}
        <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
          <SymbolSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          <MobileSymbolSearch />
          {/* Divider between the mobile search icon and the actions beside it. */}
          <div aria-hidden className="h-5 w-px shrink-0 bg-border md:hidden" />
          <MissedAlerts />
        </div>
      </header>
    </>
  )
}
