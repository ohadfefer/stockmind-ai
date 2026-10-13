import { useEffect, useState } from "react"

export interface VisualViewportBox {
  /** Gap between the layout viewport's bottom and the visible area's bottom. */
  bottom: number
  /** Height of the visible area. */
  height: number
}

/**
 * The visible part of the screen, for pinning a `position: fixed` element on
 * top of the on-screen keyboard.
 *
 * The root layout sets interactive-widget=resizes-content, which makes
 * Android Chrome shrink the layout viewport that fixed elements are placed
 * against, so `bottom` comes out 0 there. iOS Safari ignores it: its keyboard
 * covers the bottom of the layout viewport and only the visual viewport
 * shrinks, so `bottom` is the keyboard's height there.
 *
 * Returns null while disabled or where visualViewport is unsupported, so the
 * caller can fall back to plain CSS.
 */
export function useVisualViewport(enabled: boolean): VisualViewportBox | null {
  const [box, setBox] = useState<VisualViewportBox | null>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!enabled || !vv) return

    const update = () =>
      setBox({
        bottom: Math.max(0, window.innerHeight - vv.height - vv.offsetTop),
        height: vv.height,
      })
    update()
    // iOS pans the visual viewport as well as resizing it when the keyboard
    // opens, and a pan moves offsetTop without a resize.
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      // Forget the last reading, so re-enabling never starts from where the
      // keyboard was the previous time.
      setBox(null)
    }
  }, [enabled])

  return box
}
