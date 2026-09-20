import { IdCard } from "lucide-react"
import { SettingsPlaceholder } from "@/components/settings/settings-placeholder"

export default function BasicInformationSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Basic Information"
      description="Manage your name, email and profile photo."
      icon={IdCard}
    />
  )
}
