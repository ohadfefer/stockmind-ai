"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChoiceCardProps {
  title: string
  description: string
  selected: boolean
  onSelect: () => void
  stars?: number
  badge?: string
}

export function ChoiceCard({
  title,
  description,
  selected,
  onSelect,
  stars,
  badge,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        "hover:border-primary/50",
        selected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{title}</span>
        {typeof stars === "number" && (
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "size-3.5",
                  i < stars ? "fill-primary text-primary" : "text-muted-foreground/40",
                )}
              />
            ))}
          </span>
        )}
        {badge && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  )
}
