import { Target } from "lucide-react"
import { SettingsPlaceholder } from "@/components/settings/settings-placeholder"

export default function StrategySettingsPage() {
  return (
    <SettingsPlaceholder
      title="Strategy"
      description="Configure your trading strategy preferences."
      icon={Target}
    />
  )
}
