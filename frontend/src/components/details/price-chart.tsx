"use client"

import { useEffect, useRef, useState, useCallback } from "react"

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown
    }
  }
}

interface PriceChartProps {
  symbol: string
}

function loadTradingViewScript(): Promise<void> {
  if (window.TradingView) return Promise.resolve()
  return new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src="https://s3.tradingview.com/tv.js"]'
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      return
    }
    const script = document.createElement("script")
    script.src = "https://s3.tradingview.com/tv.js"
    script.async = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export function PriceChart({ symbol }: PriceChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  // Activate chart on click, deactivate when clicking outside or leaving
  const activate = useCallback(() => setActive(true), [])
  const deactivate = useCallback(() => setActive(false), [])

  useEffect(() => {
    if (!active) return

    // When iframe gains focus (user clicked inside it), window blurs
    // When user clicks back on the page, window focuses → deactivate
    window.addEventListener("focus", deactivate)
    return () => window.removeEventListener("focus", deactivate)
  }, [active, deactivate])

  useEffect(() => {
    const container = chartRef.current
    if (!container) return

    const containerId = `tv-chart-${symbol.replace(/[^a-zA-Z0-9]/g, "")}`
    container.id = containerId
    container.innerHTML = ""

    let cancelled = false

    loadTradingViewScript().then(() => {
      if (cancelled || !window.TradingView) return

      new window.TradingView.widget({
        autosize: true,
        symbol,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "3",
        locale: "en",
        allow_symbol_change: false,
        hide_volume: true,
        save_image: false,
        calendar: false,
        backgroundColor: "rgba(0, 0, 0, 0)",
        gridColor: "rgba(255, 255, 255, 0.06)",
        container_id: containerId,
      })
    })

    return () => {
      cancelled = true
      container.innerHTML = ""
    }
  }, [symbol])

  return (
    <div ref={wrapperRef} className="relative h-[400px] w-full">
      <div ref={chartRef} className="absolute inset-0" />
      {!active && (
        <div
          onClick={activate}
          className="absolute inset-0 z-10 cursor-pointer"
        />
      )}
    </div>
  )
}
