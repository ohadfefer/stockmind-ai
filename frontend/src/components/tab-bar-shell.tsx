import { cn } from "@/lib/utils"

// Shared classes for the horizontally-scrollable tab strip. The strip scrolls
// edge-to-edge on mobile (its scrollbar is hidden) so a swipe moves the tabs
// instead of dragging the page. The divider sits under the strip below md and
// moves up to the wrapper at md, where an optional action row sits alongside.
const STRIP_CLASS =
  "flex items-center gap-1 overflow-x-auto whitespace-nowrap border-b border-border px-4 md:border-b-0 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"

/**
 * Edge-to-edge tab bar used at the top of /account, /portfolio, /watchlist.
 * `-mx-*` cancels parent <main>'s p-4 md:p-6 so the strip + divider span the
 * full width on mobile; the inner rows re-add px-4 md:px-6 to keep content
 * aligned with the rest of the page. Pass scrolling tabs as `children` and an
 * optional right-side `action` (e.g. a balance readout or Trade/Orders links).
 */
export function TabBarShell({
  children,
  action,
  className,
  scrollClassName,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  /** Applied to the outer wrapper (e.g. `animate-pulse` for skeletons). */
  className?: string
  /** Applied to the inner scroll strip (e.g. extra padding for skeletons). */
  scrollClassName?: string
}) {
  return (
    <div
      className={cn(
        "-mx-4 flex flex-col md:-mx-6 md:flex-row md:items-center md:justify-between md:border-b",
        className,
      )}
    >
      <div className={cn(STRIP_CLASS, scrollClassName)}>{children}</div>
      {action}
    </div>
  )
}
