"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

export type ViewportFrame = { top: number; height: number }

/**
 * The visible part of the screen, in layout-viewport coordinates — where a
 * full-screen `position: fixed` panel has to sit so the composer stays above
 * the keyboard. `null` when inactive or unsupported (the panel's own `100dvh`
 * applies then).
 *
 * Lifted from the report dialog's sheet (`report-issue/dialog.tsx`, #415):
 * on iOS the keyboard scrolls the layout viewport (`offsetTop`) instead of
 * shrinking it, so the frame has to follow both its top and its height.
 */
export function useVisualViewport(active: boolean): ViewportFrame | null {
  const [frame, setFrame] = useState<ViewportFrame | null>(null)
  useEffect(() => {
    if (!active || typeof window === "undefined") return
    const vv = window.visualViewport
    if (!vv) return
    const update = () =>
      setFrame({ top: Math.round(vv.offsetTop), height: Math.round(vv.height) })
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      setFrame(null)
    }
  }, [active])
  return active ? frame : null
}
