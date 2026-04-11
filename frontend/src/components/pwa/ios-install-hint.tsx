"use client"

import { useEffect, useState } from "react"
import { Share, Plus } from "lucide-react"

export function IosInstallHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari exposes this legacy flag when launched from the home screen
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setShow(isIos && !isStandalone)
  }, [])

  if (!show) return null

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      <p className="mb-1 font-medium text-foreground">
        Install StockMind on your iPhone to enable notifications
      </p>
      <p className="flex flex-wrap items-center gap-1">
        Tap
        <Share className="inline size-3.5" aria-label="Share" />
        in Safari, then
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          Add to Home Screen
          <Plus className="inline size-3.5" aria-label="Add" />
        </span>
      </p>
    </div>
  )
}
