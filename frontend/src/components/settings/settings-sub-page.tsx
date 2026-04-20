import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export function SettingsSubPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <Link
        href="/settings"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to settings
      </Link>
      {children}
    </div>
  )
}
