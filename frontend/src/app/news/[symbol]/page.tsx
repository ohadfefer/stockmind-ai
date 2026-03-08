import Link from "next/link"
import { ArrowLeft, Newspaper } from "lucide-react"

export default async function SymbolNewsPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/details/${upperSymbol}`}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Newspaper className="size-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {upperSymbol} News
        </h1>
      </div>
      <p className="text-muted-foreground">
        Full news feed for {upperSymbol} — coming soon.
      </p>
    </div>
  )
}
