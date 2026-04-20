import Link from "next/link"
import {
  Settings2,
  UserRound,
  Target,
  CreditCard,
  type LucideIcon,
} from "lucide-react"

const categories: {
  key: string
  label: string
  description: string
  icon: LucideIcon
  href: string
}[] = [
  {
    key: "general",
    label: "General",
    description: "Notifications and app preferences",
    icon: Settings2,
    href: "/settings/general",
  },
  {
    key: "accounts",
    label: "Accounts",
    description: "Manage your linked accounts and profile",
    icon: UserRound,
    href: "/settings/accounts",
  },
  {
    key: "strategy",
    label: "Strategy",
    description: "Configure your trading strategy preferences",
    icon: Target,
    href: "/settings/strategy",
  },
  {
    key: "payments",
    label: "Payments",
    description: "Manage payment methods and billing",
    icon: CreditCard,
    href: "/settings/payments",
  },
]

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {categories.map((category) => (
          <Link
            key={category.key}
            href={category.href}
            className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <div className="flex size-11 items-center justify-center rounded-lg bg-muted">
              <category.icon className="size-5 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{category.label}</p>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
