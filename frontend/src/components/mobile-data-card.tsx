"use client"

import { cn } from "@/lib/utils"

/**
 * Card wrapper used as the mobile counterpart to a desktop table row.
 * Pair with `<table className="hidden md:table">` + `<div className="md:hidden">`.
 */
export function MobileDataCard({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  // When clickable, expose the card as a button to assistive tech and make it
  // keyboard-operable (Enter/Space), since a bare <div onClick> is neither.
  const interactive = Boolean(onClick)
  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
        interactive &&
          "cursor-pointer transition-colors active:bg-secondary/40 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        className,
      )}
    >
      {children}
    </div>
  )
}
