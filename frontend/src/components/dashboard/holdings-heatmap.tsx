"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { ResponsiveContainer, Treemap } from "recharts"
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
  onSelect: (ticker: string) => void
  onHover: (info: CellHoverData) => void
}

type RechartsCellProps = Omit<
  HeatmapCellProps,
  "metric" | "onSelect" | "onHover"
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
  onSelect,
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

  const reportHover = () => {
    onHover({
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
  }

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(ticker)}
      onMouseEnter={reportHover}
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
  const router = useRouter()
  const chartRef = useRef<HTMLDivElement>(null)
  const [dataset, setDataset] = useState<Dataset>("portfolio")
  const [metric, setMetric] = useState<Metric>("percent")
  const [hover, setHover] = useState<CellHoverData | null>(null)

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

  // Clear hover when the chart container resizes — cached cell coords go stale.
  useEffect(() => {
    const node = chartRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setHover(null))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const isEmpty = data.length === 0
  const handleSelect = (ticker: string) => router.push(`/details/${ticker}`)

  const switchDataset = (d: Dataset) => {
    setDataset(d)
    setHover(null)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <TabButton
            active={dataset === "portfolio"}
            onClick={() => switchDataset("portfolio")}
          >
            Holdings
          </TabButton>
          <TabButton
            active={dataset === "watchlist"}
            onClick={() => switchDataset("watchlist")}
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
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ minHeight: 280 }}
        >
          {dataset === "portfolio"
            ? "No holdings yet."
            : "No stocks in your watchlist yet."}
        </div>
      ) : (
        <div
          ref={chartRef}
          className="relative"
          style={{ width: "100%", height: 300 }}
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
                  onSelect={handleSelect}
                  onHover={setHover}
                />
              )}
            />
          </ResponsiveContainer>
          {hover && (
            <HoverTooltip
              info={hover}
              dataset={dataset}
              chartWidth={chartRef.current?.clientWidth ?? 0}
              chartHeight={chartRef.current?.clientHeight ?? 0}
            />
          )}
        </div>
      )}

      <p className="text-xs italic text-muted-foreground">
        Tile size reflects daily % change; color indicates direction
      </p>
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
  const accent = positive ? "text-[#10B981]" : "text-[#EF4444]"
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
        "border-b-2 pb-1 text-sm font-semibold uppercase tracking-wider transition-colors",
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
        "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
