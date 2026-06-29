export function TickerLogo({ logo, ticker }: { logo?: string; ticker: string }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
      {logo ? (
        // Finnhub-hosted asset; using <img> avoids requiring each profile host
        // in next.config remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={ticker}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <span className="font-mono text-[10px] font-bold text-muted-foreground">
          {ticker.slice(0, 3)}
        </span>
      )}
    </div>
  )
}
