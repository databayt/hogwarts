"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, type RefObject } from "react"

/**
 * The page opens ON the hero, not above it.
 *
 * The hero is what the reader came for, and the chrome over it — the header,
 * the gap under it — is app furniture between them on arrival. So the page
 * lands scrolled to the poster's own top edge, which is the reference app's
 * opening frame; the header is one short scroll up, where anyone looking for
 * it already scrolls.
 *
 * MEASURED, not computed: the offset above the hero is whatever the layout
 * decided to render today (header, padding, the live strip, the offline
 * banner), and any constant here would be wrong the first time one of them
 * appears. Where nothing sits above the hero — the header hidden at a wider
 * breakpoint — the offset is 0 and this does nothing.
 *
 * Shared by the lumos lesson hero and the live room's title card, which draw
 * the same frame and must open the same way.
 */
export function useOpenOnHero(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  key: string
) {
  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return
    // A restored position — back/forward, a reload part-way down — is the
    // reader's own and outranks this.
    if (window.scrollY !== 0) return
    const top = el.getBoundingClientRect().top + window.scrollY
    if (top <= 0) return
    // `instant`: this is where the page STARTS, not somewhere it travels to.
    window.scrollTo({ top, behavior: "instant" })
  }, [ref, active, key])
}
