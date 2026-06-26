import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BarChart3, Brain, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <Image
          src="/icons/icon-192x192.png"
          alt="StockMind AI"
          width={96}
          height={96}
          className="h-24 w-24"
          priority
        />
        <h1 className="text-4xl font-bold tracking-tight">StockMind AI</h1>
        <p className="text-muted-foreground max-w-md text-lg">
          AI-powered stock research and analysis at your fingertips.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col items-center gap-2 rounded-lg border p-6">
          <TrendingUp className="text-primary h-8 w-8" />
          <h3 className="font-semibold">Live Market Data</h3>
          <p className="text-muted-foreground text-sm">Real-time quotes and sector performance</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border p-6">
          <BarChart3 className="text-primary h-8 w-8" />
          <h3 className="font-semibold">Portfolio Tracking</h3>
          <p className="text-muted-foreground text-sm">Monitor your holdings and returns</p>
        </div>
        <div className="flex flex-col items-center gap-2 rounded-lg border p-6">
          <Brain className="text-primary h-8 w-8" />
          <h3 className="font-semibold">AI Insights</h3>
          <p className="text-muted-foreground text-sm">Smart analysis and recommendations</p>
        </div>
      </div>

      <Button asChild size="lg">
        <Link href="/dashboard">
          Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
