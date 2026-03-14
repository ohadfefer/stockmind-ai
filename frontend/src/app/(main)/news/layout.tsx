"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Newspaper } from "lucide-react"
import { SymbolSearch } from "@/components/symbol-search"

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const symbol = segments.length > 2 ? segments[2]?.toUpperCase() : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {symbol && (
            <Link
              href="/news"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </Link>
          )}
          <Newspaper className="size-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {symbol ? `${symbol} News` : "Market News"}
          </h1>
        </div>

        <SymbolSearch
          navigateTo="/news"
          placeholder="Search symbol news..."
          className="w-full max-w-xs"
        />
      </div>

      {children}
    </div>
  )
}
