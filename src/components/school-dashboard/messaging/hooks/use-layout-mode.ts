"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

export type LayoutMode = "mobile" | "desktop"

/** Tailwind's `md` breakpoint — the one the messaging surface splits on. */
export const DESKTOP_MEDIA_QUERY = "(min-width: 768px)"

/**
 * Which of the two messaging trees to render.
 *
 * The server cannot measure a window, so it guesses from the request's
 * client hints and passes the guess down; the first client render repeats
 * the guess so hydration matches, and only then does `matchMedia` correct
 * it. Before this both trees were always mounted and one was hidden with
 * CSS, so a phone ran the desktop split-pane's effects — its contacts fetch,
 * its virtualizer, its scroll listeners — behind a `display: none`.
 */
export function useLayoutMode(initial: LayoutMode): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(initial)

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const apply = () => setMode(query.matches ? "desktop" : "mobile")
    apply()
    query.addEventListener("change", apply)
    return () => query.removeEventListener("change", apply)
  }, [])

  return mode
}
