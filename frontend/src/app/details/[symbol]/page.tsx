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
import { Plus, Share2, TrendingDown, TrendingUp } from "lucide-react"
import { PriceChart } from "@/components/details/price-chart"
import { KeyStats, type KeyStatsData } from "@/components/details/key-stats"
import { NewsFeed } from "@/components/details/news-feed"
import { AboutSection } from "@/components/details/about-section"

function getStockData(symbol: string) {
  const stocks: Record<string, {
    name: string
    price: number
    changeDollar: number
    changePercent: number
    afterHoursPrice: number
    afterHoursChangePercent: number
    afterHoursChangeDollar: number
    closedAt: string
    exchange: string
    currency: string
    tags: string[]
    keyStats: KeyStatsData
    about: string
  }> = {
    A: {
      name: "Agilent Technologies Inc",
      price: 115.07,
      changeDollar: -3.04,
      changePercent: -2.57,
      afterHoursPrice: 116.41,
      afterHoursChangePercent: 1.16,
      afterHoursChangeDollar: 1.34,
      closedAt: "Mar 6, 8:15:58 PM UTC-4",
      exchange: "NYSE",
      currency: "USD",
      tags: ["Stock", "US listed security", "US headquartered"],
      keyStats: {
        previousClose: 118.11,
        dayRange: [114.91, 116.77],
        yearRange: [96.43, 160.27],
        marketCap: "32.52B USD",
        avgVolume: "2.39M",
        peRatio: 25.4,
        dividendYield: 0.89,
        primaryExchange: "NYSE",
      },
      about:
        "Agilent Technologies, Inc. is an American global company headquartered in Santa Clara, California, that provides instruments, software, services, and consumables for laboratories. Agilent was established in 1999 as a spin-off from Hewlett-Packard. The resulting IPO of Agilent stock was the largest in the history of Silicon Valley at the time. From 1999 to 2014, the company produced optics, semiconductors, EDA software and test and measurement equipment for electronics.",
    },
  }

  const data = stocks[symbol.toUpperCase()]
  if (data) return data

  return {
    name: `${symbol.toUpperCase()} Corp`,
    price: 189.43,
    changeDollar: 2.31,
    changePercent: 1.24,
    afterHoursPrice: 190.12,
    afterHoursChangePercent: 0.36,
    afterHoursChangeDollar: 0.69,
    closedAt: "Mar 6, 8:00:00 PM UTC-4",
    exchange: "NASDAQ",
    currency: "USD",
    tags: ["Stock", "US listed security"],
    keyStats: {
      previousClose: 187.12,
      dayRange: [185.5, 190.25] as [number, number],
      yearRange: [142.0, 199.62] as [number, number],
      marketCap: "2.94T USD",
      avgVolume: "52.4M",
      peRatio: 31.2,
      dividendYield: 0.52,
      primaryExchange: "NASDAQ",
    },
    about: `${symbol.toUpperCase()} Corp is a publicly traded company listed on major US stock exchanges.`,
  }
}

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const stock = getStockData(symbol)
  const isDown = stock.changeDollar < 0
  const afterHoursUp = stock.afterHoursChangeDollar >= 0

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
                {symbol.toUpperCase()} · {stock.exchange}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {stock.name}
          </h1>
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
          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                ${stock.price.toFixed(2)}
              </span>
              <Badge
                variant="destructive"
                className={clsx(
                  "text-sm",
                  !isDown && "bg-accent text-accent-foreground hover:bg-accent/90"
                )}
              >
                {isDown ? (
                  <TrendingDown className="size-3.5" />
                ) : (
                  <TrendingUp className="size-3.5" />
                )}
                {Math.abs(stock.changePercent).toFixed(2)}%
              </Badge>
              <span
                className={clsx(
                  "text-sm font-medium",
                  isDown ? "text-destructive" : "text-accent"
                )}
              >
                {stock.changeDollar > 0 ? "+" : ""}
                {stock.changeDollar.toFixed(2)} Today
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>After Hours:</span>
              <span className="font-medium text-foreground">
                ${stock.afterHoursPrice.toFixed(2)}
              </span>
              <span
                className={clsx(
                  "font-medium",
                  afterHoursUp ? "text-accent" : "text-destructive"
                )}
              >
                ({afterHoursUp ? "↑" : "↓"}
                {Math.abs(stock.afterHoursChangePercent).toFixed(2)}%)
              </span>
              <span
                className={clsx(
                  "font-medium",
                  afterHoursUp ? "text-accent" : "text-destructive"
                )}
              >
                {afterHoursUp ? "+" : "-"}
                {Math.abs(stock.afterHoursChangeDollar).toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              Closed: {stock.closedAt} · {stock.currency} · {stock.exchange}
            </p>
          </div>

          {/* Chart */}
          <PriceChart previousClose={stock.keyStats.previousClose} />

          <Separator />

          {/* News Feed */}
          <NewsFeed />
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
