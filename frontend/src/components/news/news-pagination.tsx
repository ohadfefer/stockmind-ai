import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NewsPaginationProps {
  page: number
  totalPages: number
  buildHref: (page: number) => string
}

export function NewsPagination({ page, totalPages, buildHref }: NewsPaginationProps) {
  if (totalPages <= 1) return null

  const hasPrev = page > 1
  const hasNext = page < totalPages

  return (
    <nav
      aria-label="pagination"
      className="mx-auto flex w-full items-center justify-center gap-2 pt-2"
    >
      {hasPrev ? (
        <Link
          href={buildHref(page - 1)}
          aria-label="Go to previous page"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1 px-2.5")}
        >
          <ChevronLeftIcon className="size-4" />
          <span className="hidden sm:block">Previous</span>
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label="Go to previous page"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1 px-2.5")}
        >
          <ChevronLeftIcon className="size-4" />
          <span className="hidden sm:block">Previous</span>
        </button>
      )}
      <span className="min-w-32 px-2 text-center text-sm tabular-nums text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {hasNext ? (
        <Link
          href={buildHref(page + 1)}
          aria-label="Go to next page"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1 px-2.5")}
        >
          <span className="hidden sm:block">Next</span>
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label="Go to next page"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1 px-2.5")}
        >
          <span className="hidden sm:block">Next</span>
          <ChevronRightIcon className="size-4" />
        </button>
      )}
    </nav>
  )
}
