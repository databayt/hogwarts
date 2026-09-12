"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

/**
 * Anything smaller than this between the layout viewport and the visual one
 * is the browser's own chrome moving, not a keyboard.
 */
const KEYBOARD_MIN_PX = 80

/**
 * The height the messaging shell should take while the on-screen keyboard is
 * up, or `null` when it is not.
 *
 * `100dvh` follows the URL bar but never the keyboard: on iOS the keyboard
 * overlays the page and Safari pans the whole document to reveal the focused
 * field, which floats the header off the top and leaves the thread's bottom
 * somewhere under the keys. WhatsApp keeps the composer on the keyboard and
 * the last message just above it. `window.visualViewport` reports the space
 * that is actually visible; sizing the shell to it, and pinning the document
 * back to the top whenever Safari pans it, gives the native layout.
 */
export function useVisualViewportHeight(enabled: boolean): number | null {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      setHeight(null)
      return
    }
    const vv = window.visualViewport
    if (!vv) return

    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const keyboardUp = window.innerHeight - vv.height > KEYBOARD_MIN_PX
        setHeight(keyboardUp ? Math.round(vv.height) : null)
        if (keyboardUp && (window.scrollY !== 0 || vv.offsetTop !== 0)) {
          window.scrollTo(0, 0)
        }
      })
    }

    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    update()
    return () => {
      cancelAnimationFrame(frame)
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [enabled])

  return height
}
