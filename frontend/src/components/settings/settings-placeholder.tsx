import type { LucideIcon } from "lucide-react"

interface SettingsPlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
}

export function SettingsPlaceholder({ title, description, icon: Icon }: SettingsPlaceholderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-10 text-center">
        <Icon className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">Coming soon</p>
      </div>
    </div>
  )
}
