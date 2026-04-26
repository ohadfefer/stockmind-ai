import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // -m-6 cancels the p-6 on <main> in (main)/layout.tsx so the divider can
    // span edge-to-edge; each pane re-adds its own p-6.
    <div className="-m-6 flex min-h-[calc(100vh-var(--header-height))]">
      <aside className="w-72 shrink-0 border-r border-border p-6">
        <h1 className="mb-6 px-3 text-lg font-semibold text-foreground">
          Settings
        </h1>
        <SettingsNav />
      </aside>
      <div className="min-w-0 flex-1 p-6">{children}</div>
    </div>
  )
}
