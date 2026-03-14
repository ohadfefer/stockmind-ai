export default async function SymbolNewsPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()

  return (
    <p className="text-muted-foreground">
      Full news feed for {upperSymbol} — coming soon.
    </p>
  )
}
