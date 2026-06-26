import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Shared sort-button primitive for table headers (portfolio, watchlist, …).
// Each table owns its own SortColumn union and comparator; this component only
// renders the clickable label + direction indicator. The three-state cycle
// (asc → desc → default) is conventionally driven by the caller's handleSort.
export type SortDirection = "asc" | "desc" | "default"

export function SortIcon({
  column,
  activeColumn,
  direction,
}: {
  column: string
  activeColumn: string | null
  direction: SortDirection
}) {
  if (activeColumn !== column || direction === "default")
    return <ArrowUpDown className="size-3 opacity-50" />
  if (direction === "asc") return <ArrowUp className="size-3" />
  return <ArrowDown className="size-3" />
}

export function SortableHeader<TColumn extends string>({
  column,
  activeColumn,
  direction,
  onSort,
  className,
  children,
}: {
  column: TColumn
  activeColumn: TColumn | null
  direction: SortDirection
  onSort: (column: TColumn) => void
  className?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {children}
      <SortIcon column={column} activeColumn={activeColumn} direction={direction} />
    </button>
  )
}
