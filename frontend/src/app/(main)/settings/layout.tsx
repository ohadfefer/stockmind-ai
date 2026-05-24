import { SettingsNav } from "@/components/settings/settings-nav"
import { SettingsMobileTabs } from "@/components/settings/settings-mobile-tabs"
import { SettingsMobileHeader } from "@/components/settings/settings-mobile-header"

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // -m-* cancels the parent <main>'s padding (p-4 md:p-6) so the divider /
    // tab strip can span edge-to-edge; each pane re-adds its own padding.
    <div className="-m-4 md:-m-6 flex min-h-[calc(100vh-var(--header-height))] flex-col md:flex-row">
      {/* Mobile only: replaces the app header (hidden on /settings) with a
          back arrow to where the user came from. Hidden on >=md. */}
      <SettingsMobileHeader />
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border p-6 md:flex">
        <h1 className="mb-6 px-3 text-lg font-semibold text-foreground">
          Settings
        </h1>
        <SettingsNav />
      </aside>
      <div className="mt-3 border-b border-border md:hidden">
        <SettingsMobileTabs />
      </div>
      <div className="min-w-0 flex-1 p-4 md:p-6">
        {/* Invisible mirror of the sidebar h1 above so the right pane's
            content starts on the same baseline as the sidebar's section
            labels (PROFILE, SUBSCRIPTION, ...). Only relevant on >=md where
            the sidebar exists; on mobile the tab strip handles separation. */}
        <h1
          aria-hidden
          className="invisible mb-6 hidden px-3 text-lg font-semibold md:block"
        >
          Settings
        </h1>
        {children}
      </div>
    </div>
  )
}
