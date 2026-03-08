import Link from "next/link"
import clsx from "clsx"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Share2 } from "lucide-react"
import { finnhubFetch } from "@/lib/finnhub"
import { PriceChart } from "@/components/details/price-chart"
import { KeyStats, type KeyStatsData } from "@/components/details/key-stats"
import { NewsFeed } from "@/components/details/news-feed"
import { AboutSection } from "@/components/details/about-section"
import { LivePrice } from "@/components/details/live-price"

interface FinnhubQuote {
  c: number  // current price
  d: number  // change
  dp: number // percent change
  h: number  // high
  l: number  // low
  o: number  // open
  pc: number // previous close
}

interface FinnhubProfile {
  country?: string
  currency?: string
  exchange?: string
  finnhubIndustry?: string
  logo?: string
  marketCapitalization?: number
  name?: string
  ticker?: string
  weburl?: string
}

function formatMarketCap(millions: number | undefined): string | null {
  if (!millions) return null
  if (millions >= 1_000_000) return `${(millions / 1_000_000).toFixed(2)}T`
  if (millions >= 1_000) return `${(millions / 1_000).toFixed(2)}B`
  return `${millions.toFixed(2)}M`
}

async function getStockData(symbol: string) {
  try {
    const [quote, profile] = await Promise.all([
      finnhubFetch("/quote", { symbol }) as Promise<FinnhubQuote>,
      finnhubFetch("/stock/profile2", { symbol }) as Promise<FinnhubProfile>,
    ])

    const hasQuote = quote && quote.c !== 0
    const hasProfile = profile && profile.name
    const exchangeShort = profile.exchange?.split(/\s+/)[0] ?? null

    const tags: string[] = ["Stock"]
    if (exchangeShort) tags.push(`${exchangeShort} listed`)
    if (hasProfile && profile.country) tags.push(`${profile.country} headquartered`)

    const mcRaw = hasProfile ? profile.marketCapitalization : undefined
    const mcFormatted = formatMarketCap(mcRaw)
    const currency = hasProfile ? profile.currency ?? "USD" : "USD"

    const keyStats: KeyStatsData = {
      previousClose: hasQuote ? quote.pc : null,
      dayRange: hasQuote ? [quote.l, quote.h] : [null, null],
      yearRange: [null, null],
      marketCap: mcFormatted ? `${mcFormatted} ${currency}` : null,
      avgVolume: null,
      peRatio: null,
      dividendYield: null,
      primaryExchange: exchangeShort,
    }

    return {
      name: hasProfile ? profile.name! : symbol.toUpperCase(),
      price: hasQuote ? quote.c : 0,
      changeDollar: hasQuote ? quote.d : 0,
      changePercent: hasQuote ? quote.dp : 0,
      previousClose: hasQuote ? quote.pc : 0,
      exchange: exchangeShort ?? "-",
      currency,
      tags,
      keyStats,
      about: hasProfile
        ? `${profile.name} is a ${profile.finnhubIndustry ?? ""} company${profile.country ? ` headquartered in ${profile.country}` : ""}.${profile.weburl ? ` Website: ${profile.weburl}` : ""}`
        : `${symbol.toUpperCase()} — no profile data available.`,
      logo: hasProfile ? profile.logo : undefined,
    }
  } catch {
    return {
      name: symbol.toUpperCase(),
      price: 0,
      changeDollar: 0,
      changePercent: 0,
      previousClose: 0,
      exchange: "-",
      currency: "USD",
      tags: ["Stock"],
      keyStats: {
        previousClose: null,
        dayRange: [null, null] as [null, null],
        yearRange: [null, null] as [null, null],
        marketCap: null,
        avgVolume: null,
        peRatio: null,
        dividendYield: null,
        primaryExchange: null,
      },
      about: "Unable to load company data.",
      logo: undefined,
    }
  }
}

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()
  const stock = await getStockData(upperSymbol)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">HOME</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {upperSymbol} · {stock.exchange}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stock.logo && (
              <img
                src={stock.logo}
                alt={stock.name}
                className="size-8 rounded-md"
              />
            )}
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {stock.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="size-4" />
              Follow
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="size-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Live Price */}
          <LivePrice
            symbol={upperSymbol}
            initialPrice={stock.price}
            initialChange={stock.changeDollar}
            initialChangePercent={stock.changePercent}
            previousClose={stock.previousClose}
          />

          {stock.price > 0 && (
            <p className="text-xs text-muted-foreground">
              {stock.currency} · {stock.exchange}
            </p>
          )}

          {/* Chart */}
          <PriceChart previousClose={stock.previousClose} />

          <Separator />

          {/* News Feed */}
          <NewsFeed symbol={upperSymbol} />
        </div>

        {/* Sidebar */}
        <div className="w-full space-y-6 lg:w-80">
          {/* Tags */}
          <Card>
            <CardContent className="flex flex-wrap gap-2">
              {stock.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {/* Key Stats */}
          <Card>
            <CardContent>
              <KeyStats data={stock.keyStats} />
            </CardContent>
          </Card>

          {/* About */}
          <AboutSection companyName={stock.name} description={stock.about} />
        </div>
      </div>
    </div>
  )
}
