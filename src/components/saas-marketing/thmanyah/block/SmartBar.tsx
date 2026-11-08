"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

/**
 * The homepage header's "smart" frame (ported from ~/farm's SiteHeader
 * overlay mode). While the hero fills the screen the bar sits transparent on
 * the green with the light theme's ink pinned (`data-over`); past the hero it
 * steps out of the way as the reader scrolls down (`data-away`) and comes back,
 * solid in the page's own theme, the moment they scroll up. A focused control
 * inside keeps it on screen, so keyboard users never tab into a hidden bar.
 */
export function SmartBar({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const bar = ref.current
    if (!bar) return
    let last = window.scrollY
    let frame = 0
    const update = () => {
      const y = window.scrollY
      const onHero = y < window.innerHeight - bar.offsetHeight
      bar.toggleAttribute("data-over", onHero)
      if (Math.abs(y - last) < 4) return
      bar.toggleAttribute("data-away", !onHero && y > last)
      last = y
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-over=""
      className="bg-background fixed inset-x-0 top-0 z-50 border-b transition-[translate,background-color,border-color] duration-300 data-[away]:not-focus-within:-translate-y-full data-[over]:border-transparent data-[over]:bg-transparent data-[over]:[--accent-foreground:oklch(0.145_0_0)] data-[over]:[--accent:oklch(0_0_0/0.08)] data-[over]:[--foreground:oklch(0.145_0_0)] data-[over]:[--muted-foreground:oklch(0.145_0_0/0.72)] data-[over]:**:data-[slot=separator]:!bg-black/20 data-[over]:[&_img]:!filter-none"
    >
      {children}
    </div>
  )
}
