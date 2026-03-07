export default async function DetailsPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">{symbol}</h1>
      <p className="text-muted-foreground">Stock details page — coming soon.</p>
    </div>
  )
}
