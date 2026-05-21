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
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
        onClick && "cursor-pointer transition-colors active:bg-secondary/40",
        className,
      )}
    >
      {children}
    </div>
  )
}
