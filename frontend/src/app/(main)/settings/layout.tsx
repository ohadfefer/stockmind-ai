import { SettingsNav } from "@/components/settings/settings-nav"
import { SettingsMobileTabs } from "@/components/settings/settings-mobile-tabs"

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // -m-* cancels the parent <main>'s padding (p-4 md:p-6) so the divider /
    // tab strip can span edge-to-edge; each pane re-adds its own padding. The
    // min-h adds that same padding back onto 100% of <main>'s content box, so
    // the pane floor is exactly the scroll viewport — the aside's divider runs
    // to the bottom on a short page without forcing a scrollbar. Measuring the
    // viewport directly can't work: the chrome above differs per breakpoint
    // (56px app header on >=md, 44px settings header below it).
    <div className="-m-4 md:-m-6 flex min-h-[calc(100%+2rem)] flex-col md:min-h-[calc(100%+3rem)] md:flex-row">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border p-6 md:flex">
        <h1 className="mb-6 px-3 text-lg font-semibold text-foreground">
          Settings
        </h1>
        <SettingsNav />
      </aside>
      {/* Flush under the mobile header — the tabs' own py-3 is the breathing
          room, so no margin on top of it. */}
      <div className="border-b border-border md:hidden">
        <SettingsMobileTabs />
      </div>
      <div className="min-w-0 flex-1 p-4 md:p-6">
        {/* One centered column for every section, so Strategy, General,
            Payments and the placeholders all measure the same instead of each
            stretching to whatever the nav leaves over. Below md it never
            binds, so the column is simply full width. */}
        <div className="mx-auto w-full max-w-4xl">
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
    </div>
  )
}
