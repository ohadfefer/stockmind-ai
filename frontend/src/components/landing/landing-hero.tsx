"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

const CELL = 44 // px — matches the grid background's square size
const DECAY = 0.94 // per-frame intensity multiplier (closer to 1 = slower fade)
const FADE_FLOOR = 0.05 // remove a cell once it fades below this
const FADE_TAIL = 0.25 // intensity below which opacity starts dropping

// Blue shades a square steps through as it ages, vivid → pale (newest first).
const BLUES = ["#0051ff", "#1f75ffe2", "#2f8dffd1", "#56a5ffba", "#67abffa6", "#97c4ff88"]

function blueFor(intensity: number) {
  const idx = Math.min(BLUES.length - 1, Math.floor((1 - intensity) * BLUES.length))
  return BLUES[idx]
}

type LitCell = { key: string; col: number; row: number; intensity: number }

// Pointer trail rendered over the grid background. Kept as its own component so
// the per-frame state updates only re-render this layer, not the static hero.
function HoverTrail({ targetRef }: { targetRef: RefObject<HTMLElement | null> }) {
  const cellsRef = useRef<Map<string, LitCell>>(new Map())
  const rafRef = useRef(0)
  const runningRef = useRef(false)
  const lastRef = useRef<{ x: number; y: number } | null>(null)
  const lastCellRef = useRef<string | null>(null)
  const [cells, setCells] = useState<LitCell[]>([])

  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    // The target's box only changes on resize/scroll, so cache it instead of
    // reading layout on every (high-frequency) pointer move.
    let rect = target.getBoundingClientRect()
    const refreshRect = () => {
      rect = target.getBoundingClientRect()
    }

    const light = (col: number, row: number) => {
      const key = `${col}:${row}`
      const cell = cellsRef.current.get(key)
      if (cell) cell.intensity = 1
      else cellsRef.current.set(key, { key, col, row, intensity: 1 })
    }

    const tick = () => {
      const map = cellsRef.current
      for (const [key, cell] of map) {
        cell.intensity *= DECAY
        if (cell.intensity < FADE_FLOOR) map.delete(key)
      }
      setCells(Array.from(map.values()))
      if (map.size > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        runningRef.current = false
      }
    }

    const start = () => {
      if (runningRef.current) return
      runningRef.current = true
      rafRef.current = requestAnimationFrame(tick)
    }

    // Light a cell only when the cursor *enters* it — moving around inside the
    // same square leaves it untouched so it keeps fading.
    const onMove = (e: PointerEvent) => {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return

      let runningKey = lastCellRef.current
      const visit = (px: number, py: number) => {
        const col = Math.floor(px / CELL)
        const row = Math.floor(py / CELL)
        const key = `${col}:${row}`
        if (key !== runningKey) {
          light(col, row)
          runningKey = key
        }
      }

      // Interpolate from the previous point so a fast sweep lights every crossed
      // cell instead of skipping over them.
      const prev = lastRef.current
      if (prev) {
        const dx = x - prev.x
        const dy = y - prev.y
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (CELL / 2)))
        for (let i = 1; i <= steps; i++) {
          visit(prev.x + (dx * i) / steps, prev.y + (dy * i) / steps)
        }
      } else {
        visit(x, y)
      }

      lastRef.current = { x, y }
      lastCellRef.current = runningKey
      if (cellsRef.current.size > 0) start()
    }

    const onLeave = () => {
      lastRef.current = null
      lastCellRef.current = null
    }

    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerleave", onLeave)
    window.addEventListener("resize", refreshRect)
    window.addEventListener("scroll", refreshRect, { passive: true })
    return () => {
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("resize", refreshRect)
      window.removeEventListener("scroll", refreshRect)
      cancelAnimationFrame(rafRef.current)
    }
  }, [targetRef])

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {cells.map((c) => (
        <span
          key={c.key}
          className="absolute"
          style={{
            left: c.col * CELL,
            top: c.row * CELL,
            width: CELL,
            height: CELL,
            backgroundColor: blueFor(c.intensity),
            opacity: Math.min(1, c.intensity / FADE_TAIL),
          }}
        />
      ))}
    </div>
  )
}

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null)

  return (
    <section
      ref={sectionRef}
      className="relative hidden overflow-hidden bg-primary/5 lg:block"
    >
      {/* Aurora background */}
      <div className="aurora absolute inset-0" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-foreground) 1px, transparent 1px), linear-gradient(to bottom, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      {/* Hover trail — squares the cursor passes over light up and fade out */}
      <HoverTrail targetRef={sectionRef} />

      {/* Hero content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-12">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="hero-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live markets
          </span>
          <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-foreground text-balance">
            Research smarter with an AI co-pilot for the markets.
          </h2>
        </div>
      </div>

      {/* Hero-scoped animations. Class/keyframe names are namespaced (hero-*)
          so they can't collide with Tailwind utilities (e.g. animate-ping). */}
      <style>{`
        @keyframes aurora-shift {
          0%, 100% { transform: translate3d(-5%, -5%, 0) scale(1.1); }
          50% { transform: translate3d(5%, 5%, 0) scale(1.25); }
        }
        .aurora {
          background:
            radial-gradient(40% 50% at 20% 20%, var(--color-primary) 0%, transparent 60%),
            radial-gradient(45% 55% at 80% 30%, var(--color-accent) 0%, transparent 60%),
            radial-gradient(50% 50% at 60% 90%, var(--color-primary) 0%, transparent 55%);
          opacity: 0.18;
          filter: blur(40px);
          animation: aurora-shift 16s ease-in-out infinite;
        }
        @keyframes hero-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .hero-ping { animation: hero-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite; }

        @media (prefers-reduced-motion: reduce) {
          .aurora, .hero-ping {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  )
}
