// The settings routes in nav order, defined once. SettingsNav renders them
// grouped in the desktop sidebar; SettingsMobileTabs flattens them into the
// mobile strip. Keeping two copies meant a new section could ship reachable
// on one viewport and invisible on the other, with nothing to fail the build.

export type SettingsNavItem = {
  label: string
  href: string
  // For the mobile strip, where the full label would crowd the row.
  shortLabel?: string
}

export type SettingsNavSection = {
  id: string
  heading: string
  items: SettingsNavItem[]
}

export const SETTINGS_SECTIONS: SettingsNavSection[] = [
  {
    id: "profile",
    heading: "Profile",
    items: [
      {
        label: "Basic Information",
        href: "/settings/basic-information",
        shortLabel: "Basic Info",
      },
      { label: "Accounts", href: "/settings/accounts" },
      { label: "Strategy", href: "/settings/strategy" },
      { label: "Notifications", href: "/settings/notifications" },
    ],
  },
  {
    id: "subscription",
    heading: "Subscription",
    items: [{ label: "Payments", href: "/settings/payments" }],
  },
  {
    id: "brokerage",
    heading: "Stockmind brokerage",
    items: [
      {
        label: "Stockmind Brokerage",
        href: "/settings/brokerage",
        shortLabel: "Brokerage",
      },
    ],
  },
]

// Every section's items in one flat list, headings dropped — the mobile strip
// has no room to group them.
export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = SETTINGS_SECTIONS.flatMap(
  (section) => section.items,
)
