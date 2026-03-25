import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { WatchlistStockData } from "@/types/watchlist"

function getAIScoreColor(score: number): string {
  if (score >= 8) return "bg-[#10B981] text-[#FFFFFF]"
  if (score >= 6) return "bg-[#F59E0B] text-[#0A0B0D]"
  return "bg-[#EF4444] text-[#FFFFFF]"
}

function RangeBar({
  low,
  high,
  current,
}: {
  low: number
  high: number
  current: number
}) {
  const range = high - low
  const position = range > 0 ? ((current - low) / range) * 100 : 50
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] text-muted-foreground">
        {low.toFixed(0)}
      </span>
      <div className="relative h-1.5 w-20 rounded-full bg-secondary">
        <div
          className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `calc(${Math.min(Math.max(position, 0), 100)}% - 5px)` }}
        />
      </div>
      <span className="font-mono text-[11px] text-muted-foreground">
        {high.toFixed(0)}
      </span>
    </div>
  )
}

interface WatchlistQuickViewProps {
  stocks: WatchlistStockData[]
}

export function WatchlistQuickView({ stocks }: WatchlistQuickViewProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">My Watchlist</h2>
        <Link
          href="/watchlist"
          className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          View All
        </Link>
      </div>

      {stocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            No stocks in your watchlist yet.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Symbol
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Price
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Change $
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Change %
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Day Range
              </TableHead>
              <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AI Score
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stocks.map((stock) => {
              const positive = stock.changePercent >= 0
              return (
                <TableRow
                  key={stock.ticker}
                  className="border-border transition-colors hover:bg-secondary/50 [&>td]:py-1"
                >
                  <TableCell className="p-0">
                    <Link
                      href={`/details/${stock.ticker}`}
                      className="block px-2 py-3 pl-5 font-mono text-sm font-bold text-foreground"
                    >
                      {stock.ticker}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-foreground">
                    ${stock.price.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`font-mono text-sm font-semibold ${
                      positive ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                  >
                    {positive ? "+" : ""}${stock.changeDollar.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`font-mono text-sm font-semibold ${
                      positive ? "text-[#10B981]" : "text-[#EF4444]"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    {stock.dayLow != null && stock.dayHigh != null ? (
                      <RangeBar
                        low={stock.dayLow}
                        high={stock.dayHigh}
                        current={stock.price}
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {stock.aiScore != null ? (
                      <span
                        className={`inline-flex size-8 items-center justify-center rounded-lg font-mono text-xs font-bold ${getAIScoreColor(
                          stock.aiScore
                        )}`}
                      >
                        {stock.aiScore}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
