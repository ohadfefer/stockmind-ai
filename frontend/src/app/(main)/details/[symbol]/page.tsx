import Link from "next/link"
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
import { Bot } from "lucide-react"
import { PriceChart } from "@/components/details/price-chart"
import { KeyStats } from "@/components/details/key-stats"
import { NewsFeed } from "@/components/details/news-feed"
import { AboutSection } from "@/components/details/about-section"
import { LivePrice } from "@/components/details/live-price"
import { FollowButton } from "@/components/details/follow-button"
import { CreateAlertDialog } from "@/components/alerts/create-alert-dialog"
import { getStockData } from "@/services/stock/stock-service"
import { getUserIdByAuth0Id } from "@/services/user-service"
import { isFollowing } from "@/services/watchlist-items-service"
import { auth0 } from "@/lib/auth0"

export default async function DetailsPage({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params
  const upperSymbol = symbol.toUpperCase()

  const [stock, session] = await Promise.all([
    getStockData(upperSymbol),
    auth0.getSession(),
  ])

  let initialFollowing = false
  if (session?.user?.sub) {
    const userId = await getUserIdByAuth0Id(session.user.sub)
    if (userId) {
      initialFollowing = await isFollowing(userId, upperSymbol)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">HOME</Link>
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
            <FollowButton symbol={upperSymbol} initialFollowing={initialFollowing} />
            <CreateAlertDialog symbol={upperSymbol} />
            <Button variant="outline" size="sm">
              <Bot className="size-4" />
              Analyze
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
          <PriceChart symbol={upperSymbol} />

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
