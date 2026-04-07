import { GeneralSettings } from "@/components/settings/general"

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-lg font-bold text-foreground">Settings</h1>
      <GeneralSettings />
    </div>
  )
}
