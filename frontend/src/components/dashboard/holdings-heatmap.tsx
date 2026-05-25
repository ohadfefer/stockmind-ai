"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { ResponsiveContainer, Treemap } from "recharts"
import { ChevronLeft, Expand, Triangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Holding } from "@/services/portfolio/portfolio-service"
import type { WatchlistStockData } from "@/types/watchlist"

type Dataset = "portfolio" | "watchlist"
type Metric = "percent" | "dollar"

interface HoldingsHeatmapProps {
  holdings: Holding[]
  watchlist: WatchlistStockData[]
}

interface CellHoverData {
  ticker: string
  changePercent: number
  changeDollar: number
  marketValue: number
  price: number
  cellX: number
  cellY: number
  cellWidth: number
  cellHeight: number
}

type ChartDatum = {
  ticker: string
  changePercent: number
  changeDollar: number
  marketValue: number
  price: number
  weight: number
}

function getCellColor(change: number) {
  const abs = Math.abs(change)
  if (change < 0) {
    if (abs >= 3) return "#e53228"
    if (abs >= 2) return "#DC2626"
    if (abs >= 1.5) return "#E55A48"
    if (abs >= 1) return "#EC8F7E"
    if (abs >= 0.5) return "#F2A89B"
    return "#F2BFB3"
  }
  if (change > 0) {
    if (abs >= 3) return "#0ec85b"
    if (abs >= 2) return "#22C55E"
    if (abs >= 1.5) return "#7DBF8C"
    if (abs >= 1) return "#A8D2AC"
    if (abs >= 0.5) return "#C4E0C8"
    return "#D4E3CB"
  }
  return "#3F3F46"
}

function formatPercent(p: number) {
  return `${p >= 0 ? "+" : ""}${p.toFixed(2)}%`
}

function formatGain(d: number) {
  const sign = d >= 0 ? "+" : "-"
  return `${sign}$${Math.abs(d).toFixed(2)}`
}

function formatPrice(d: number) {
  return `$${d.toFixed(2)}`
}

function accentClass(positive: boolean) {
  return positive ? "text-[#10B981]" : "text-[#EF4444]"
}

function cellValueText(metric: Metric, percent: number, dollar: number) {
  if (metric === "percent") return formatPercent(percent)
  return formatGain(dollar)
}

interface HeatmapCellProps {
  x?: number
  y?: number
  width?: number
  height?: number
  ticker?: string
  changePercent?: number
  changeDollar?: number
  marketValue?: number
  price?: number
  metric: Metric
  onActivate: (info: CellHoverData) => void
  onHover: (info: CellHoverData) => void
}

type RechartsCellProps = Omit<
  HeatmapCellProps,
  "metric" | "onActivate" | "onHover"
>

function HeatmapCell({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  ticker,
  changePercent = 0,
  changeDollar = 0,
  marketValue = 0,
  price = 0,
  metric,
  onActivate,
  onHover,
}: HeatmapCellProps) {
  if (!ticker || width <= 0 || height <= 0) return null

  const fill = getCellColor(changePercent)
  const showLabel = width >= 50 && height >= 38
  const tickerSize = Math.round(
    Math.min(Math.max(Math.min(width, height) * 0.16, 12), 26),
  )
  const valueSize = Math.round(Math.max(tickerSize * 0.55, 10))
  const textColor = "#1A1D25"

  const buildInfo = (): CellHoverData => ({
    ticker,
    changePercent,
    changeDollar,
    marketValue,
    price,
    cellX: x,
    cellY: y,
    cellWidth: width,
    cellHeight: height,
  })

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={() => onActivate(buildInfo())}
      onMouseEnter={() => onHover(buildInfo())}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="#111318"
        strokeWidth={4}
      />
      {showLabel && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - tickerSize * 0.2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={tickerSize}
            fontWeight={700}
            fill={textColor}
            style={{ fontFamily: "inherit" }}
          >
            {ticker}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + tickerSize * 0.75}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={valueSize}
            fill={textColor}
            style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
          >
            {cellValueText(metric, changePercent, changeDollar)}
          </text>
        </>
      )}
    </g>
  )
}

export function HoldingsHeatmap({
  holdings,
  watchlist,
}: HoldingsHeatmapProps) {
  const [dataset, setDataset] = useState<Dataset>("portfolio")
  const [metric, setMetric] = useState<Metric>("percent")
  const [isTouch, setIsTouch] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const data = useMemo(() => {
    const rawData =
      dataset === "portfolio"
        ? holdings.map((h) => ({
            ticker: h.ticker,
            changePercent: h.dayChangePercent,
            changeDollar: h.dayChangeDollar,
            marketValue: h.totalValue,
            price: h.currentPrice,
          }))
        : watchlist.map((w) => ({
            ticker: w.ticker,
            changePercent: w.changePercent,
            changeDollar: w.changeDollar,
            marketValue: 0,
            price: w.price,
          }))

    const withWeight = rawData.map((item) => ({
      ...item,
      weight: Math.max(Math.abs(item.changePercent), 0.1),
    }))

    return withWeight.sort((a, b) => b.weight - a.weight)
  }, [dataset, holdings, watchlist])

  // Treat devices that can't hover (touch screens) as tap-to-open.
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)")
    const update = () => setIsTouch(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const isEmpty = data.length === 0
  const title = dataset === "portfolio" ? "Holdings" : "Watchlist"

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          <TabButton
            active={dataset === "portfolio"}
            onClick={() => setDataset("portfolio")}
          >
            Holdings
          </TabButton>
          <TabButton
            active={dataset === "watchlist"}
            onClick={() => setDataset("watchlist")}
          >
            Watchlist
          </TabButton>
        </div>
        <div className="flex items-center gap-1">
          <MetricButton
            active={metric === "percent"}
            onClick={() => setMetric("percent")}
            label="Show percent change"
          >
            %
          </MetricButton>
          <MetricButton
            active={metric === "dollar"}
            onClick={() => setMetric("dollar")}
            label="Show dollar change"
          >
            $
          </MetricButton>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
          {dataset === "portfolio"
            ? "No holdings yet."
            : "No stocks in your watchlist yet."}
        </div>
      ) : (
        <div className="relative h-[280px] w-full md:h-[300px] lg:h-[360px]">
          <HeatmapChart
            key={dataset}
            data={data}
            metric={metric}
            dataset={dataset}
            isTouch={isTouch}
            className="h-full w-full"
          />
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Expand heatmap"
            className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md ring-1 ring-border backdrop-blur transition hover:bg-background md:hidden"
          >
            <Expand className="size-3.5" />
          </button>
        </div>
      )}

      <p className="text-xs italic text-muted-foreground">
        Tile size reflects daily % change
      </p>

      {fullscreen && !isEmpty && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Back"
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary"
            >
              <ChevronLeft className="size-6" />
            </button>
            <span className="flex-1 text-center text-lg font-semibold text-foreground">
              {title}
            </span>
            <div className="size-9 shrink-0" aria-hidden />
          </div>
          <div className="min-h-0 flex-1 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <HeatmapChart
              key={`fs-${dataset}`}
              data={data}
              metric={metric}
              dataset={dataset}
              isTouch={isTouch}
              showViewDetails={false}
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function HeatmapChart({
  data,
  metric,
  dataset,
  isTouch,
  showViewDetails = true,
  className,
}: {
  data: ChartDatum[]
  metric: Metric
  dataset: Dataset
  isTouch: boolean
  showViewDetails?: boolean
  className?: string
}) {
  const router = useRouter()
  const chartRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<CellHoverData | null>(null)
  // Touch devices can't hover, so they get a tap-to-open modal instead.
  const [selected, setSelected] = useState<CellHoverData | null>(null)

  // Clear hover when the chart container resizes — cached cell coords go stale.
  useEffect(() => {
    const node = chartRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setHover(null))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleSelect = (ticker: string) => router.push(`/details/${ticker}`)

  // Desktop click navigates straight to details; touch opens the modal.
  const handleActivate = (info: CellHoverData) => {
    if (isTouch) setSelected(info)
    else handleSelect(info.ticker)
  }

  return (
    <div
      ref={chartRef}
      className={cn("relative", className)}
      onMouseLeave={() => setHover(null)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="weight"
          aspectRatio={4 / 3}
          isAnimationActive={false}
          content={(props: object) => (
            <HeatmapCell
              {...(props as RechartsCellProps)}
              metric={metric}
              onActivate={handleActivate}
              onHover={setHover}
            />
          )}
        />
      </ResponsiveContainer>
      {!isTouch && hover && (
        <HoverTooltip
          info={hover}
          dataset={dataset}
          chartWidth={chartRef.current?.clientWidth ?? 0}
          chartHeight={chartRef.current?.clientHeight ?? 0}
        />
      )}
      {isTouch && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <MobileDetailCard
            key={selected.ticker}
            info={selected}
            dataset={dataset}
            onClose={() => setSelected(null)}
            onViewDetails={
              showViewDetails ? () => handleSelect(selected.ticker) : undefined
            }
          />
        </div>
      )}
    </div>
  )
}

function HoverTooltip({
  info,
  dataset,
  chartWidth,
  chartHeight,
}: {
  info: CellHoverData
  dataset: Dataset
  chartWidth: number
  chartHeight: number
}) {
  const centerX = info.cellX + info.cellWidth / 2
  const centerY = info.cellY + info.cellHeight / 2
  const onLeft = centerX < chartWidth / 2
  const onTop = centerY < chartHeight / 2

  const style: React.CSSProperties = {}
  if (onLeft) style.left = centerX
  else style.right = chartWidth - centerX
  if (onTop) style.top = centerY
  else style.bottom = chartHeight - centerY

  const positive = info.changePercent >= 0
  const accent = accentClass(positive)
  const lastLabel = dataset === "portfolio" ? "Market value" : "Price"
  const lastValue =
    dataset === "portfolio" ? info.marketValue : info.price

  return (
    <div
      key={info.ticker}
      className="pointer-events-none absolute z-10 rounded-md border border-border bg-card px-3 py-2 shadow-lg duration-200 animate-in fade-in zoom-in-95"
      style={style}
    >
      <div className="font-mono text-sm font-bold text-foreground">
        {info.ticker}
      </div>
      <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">Today&apos;s return</span>
        <span className={cn("text-right font-mono font-semibold", accent)}>
          {formatPercent(info.changePercent)}
        </span>
        <span className="text-muted-foreground">Today&apos;s gain</span>
        <span className={cn("text-right font-mono font-semibold", accent)}>
          {formatGain(info.changeDollar)}
        </span>
        <span className="text-muted-foreground">{lastLabel}</span>
        <span className="text-right font-mono text-foreground">
          {formatPrice(lastValue)}
        </span>
      </div>
    </div>
  )
}

// Touch-only: tapping a cell opens this centered modal instead of navigating.
function MobileDetailCard({
  info,
  dataset,
  onClose,
  onViewDetails,
}: {
  info: CellHoverData
  dataset: Dataset
  onClose: () => void
  onViewDetails?: () => void
}) {
  const positive = info.changePercent >= 0
  const accent = accentClass(positive)
  const lastLabel = dataset === "portfolio" ? "Market Value" : "Price"
  const lastValue = dataset === "portfolio" ? info.marketValue : info.price

  return (
    <div className="relative z-10 w-full max-w-xs rounded-lg border border-border bg-card p-4 shadow-xl duration-150 animate-in fade-in zoom-in-95">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2.5 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-5" />
      </button>

      <div className="font-mono text-lg font-bold text-foreground">
        {info.ticker}
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <span className="text-muted-foreground">Today&apos;s Return</span>
        <span
          className={cn(
            "flex items-center justify-end gap-1 font-mono font-semibold",
            accent,
          )}
        >
          <Triangle className={cn("size-2.5 fill-current", !positive && "rotate-180")} />
          {formatPercent(info.changePercent)}
        </span>

        <span className="text-muted-foreground">Today&apos;s Gain</span>
        <span
          className={cn(
            "flex items-center justify-end gap-1 font-mono font-semibold",
            accent,
          )}
        >
          <Triangle className={cn("size-2.5 fill-current", !positive && "rotate-180")} />
          {formatGain(info.changeDollar)}
        </span>

        <span className="text-muted-foreground">{lastLabel}</span>
        <span className="text-right font-mono text-foreground">
          {formatPrice(lastValue)}
        </span>
      </div>

      {onViewDetails && (
        <button
          type="button"
          onClick={onViewDetails}
          className="mt-4 w-full text-center text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          View Details
        </button>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 pb-1 text-xs font-semibold uppercase tracking-wider transition-colors md:text-sm",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function MetricButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold transition-colors md:size-7 md:text-xs",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
