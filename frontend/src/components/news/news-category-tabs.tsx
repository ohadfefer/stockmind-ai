import Link from "next/link"
import { cn } from "@/lib/utils"

const categories = [
  { value: "general", label: "General" },
  { value: "forex", label: "Forex" },
  { value: "crypto", label: "Crypto" },
  { value: "merger", label: "Merger" },
] as const

export type NewsCategory = (typeof categories)[number]["value"]

export function NewsCategoryTabs({ activeCategory }: { activeCategory: string }) {
  return (
    <div className="flex gap-2">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.value
        const href = cat.value === "general" ? "/news" : `/news?category=${cat.value}`
        return (
          <Link
            key={cat.value}
            href={href}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.label}
          </Link>
        )
      })}
    </div>
  )
}
