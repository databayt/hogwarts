"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * The homepage header's frame: a hamburger that unfolds the bar in place, and
 * the "smart" scroll behaviour ported from ~/farm's SiteHeader overlay mode.
 *
 * Toggle: closed, only the hamburger shows; open, the page links and the
 * action icons (`children`) appear in the same bar — on a phone the links take
 * a second row that scrolls sideways. It folds back up when the reader moves
 * on — Escape, a press outside, a link, or scrolling away. The icon morphs between two lines and an X.
 *
 * Scroll: while the hero fills the screen the bar is transparent on the green
 * with the light theme's ink pinned (`data-over`); past the hero it steps out
 * of the way as the reader scrolls down (`data-away`) and comes back, solid in
 * the page's own theme, the moment they scroll up. A control with keyboard
 * focus keeps it on screen (mouse focus does not, or a clicked hamburger would
 * pin it).
 *
 * `variant="page"` is the same bar on every other marketing page (features,
 * community, pricing, docs), reduced to its open state: no hamburger, no
 * border, and not fixed or sticky — it sits in the page flow at the top and
 * scrolls away with it, on the page's own gutters. No scroll behaviour.
 */
export function SmartBar({
  dir,
  links,
  labels,
  variant = "hero",
  children,
}: {
  dir: "rtl" | "ltr"
  /** `event`: on the homepage bar, dispatch this window event instead of
   *  navigating (HeroBlock's contact panel); `href` still serves every
   *  other page and a modified click. */
  links: { label: string; href: string; event?: string }[]
  labels: { open: string; close: string; nav: string }
  variant?: "hero" | "page"
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const page = variant === "page"
  const [open, setOpen] = React.useState(page)
  const id = React.useId()

  React.useEffect(() => {
    const bar = ref.current
    if (!bar || page) return
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
  }, [page])

  React.useEffect(() => {
    if (!open || page) return
    // An open bar folds back up as soon as the reader moves on: Escape, a
    // press anywhere outside it, or scrolling ~40px away from where it opened.
    const from = window.scrollY
    const shut = () => setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && shut()
    const onPointer = (e: PointerEvent) =>
      !ref.current?.contains(e.target as Node) && shut()
    const onScroll = () => Math.abs(window.scrollY - from) > 40 && shut()
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onPointer)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onPointer)
      window.removeEventListener("scroll", onScroll)
    }
  }, [open, page])

  const linkList = links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={(e) => {
        if (!page && link.event && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault()
          window.history.replaceState(
            window.history.state,
            "",
            `${window.location.pathname}${window.location.search}${new URL(link.href, window.location.href).hash}`
          )
          window.dispatchEvent(new Event(link.event))
        }
        if (!page) setOpen(false)
      }}
      className="text-muted-foreground hover:text-foreground text-base whitespace-nowrap transition-colors md:text-[17px]"
    >
      {link.label}
    </Link>
  ))

  return (
    <div
      ref={ref}
      data-over={page ? undefined : ""}
      data-open={open ? "" : undefined}
      className={
        page
          ? "relative z-10"
          : "bg-background fixed inset-x-0 top-0 z-50 border-b transition-[translate,background-color,border-color] duration-300 data-[away]:not-has-focus-visible:-translate-y-full data-[over]:border-transparent data-[over]:bg-transparent data-[over]:[--accent-foreground:oklch(0.145_0_0)] data-[over]:[--accent:oklch(0_0_0/0.08)] data-[over]:[--foreground:oklch(0.145_0_0)] data-[over]:[--muted-foreground:oklch(0.145_0_0/0.72)] data-[over]:**:data-[slot=separator]:!bg-black/20"
      }
    >
      <header
        data-slot="site-header"
        dir={dir}
        className={cn(
          "text-foreground",
          !page && "px-[5%] min-[1200px]:px-[60px]"
        )}
      >
        <div
          className={cn(
            "flex h-16 w-full items-center",
            !page && "mx-auto min-[2637px]:max-w-[1320px]",
            "gap-2 **:data-[slot=separator]:!h-5 md:gap-8"
          )}
        >
          {!page && (
            <button
              type="button"
              aria-label={open ? labels.close : labels.open}
              aria-expanded={open}
              aria-controls={id}
              onClick={() => setOpen((v) => !v)}
              className="-ms-3 inline-grid size-11 shrink-0 place-items-center"
            >
              <span aria-hidden className="relative block h-4 w-5">
                <span
                  className={cn(
                    "absolute inset-x-0 top-0.5 h-0.5 rounded-full bg-current transition-transform duration-200",
                    open && "translate-y-[5px] rotate-45"
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0.5 h-0.5 rounded-full bg-current transition-transform duration-200",
                    open && "-translate-y-[5px] -rotate-45"
                  )}
                />
              </span>
            </button>
          )}

          {open && (
            <>
              <nav
                id={id}
                aria-label={labels.nav}
                className="hidden items-center gap-6 md:flex xl:gap-8"
              >
                {linkList}
              </nav>
              <div className="ms-auto -me-2 flex items-center gap-1 [&_button]:!size-10 [&_svg]:!size-5 [&>a]:!size-10">
                {children}
              </div>
            </>
          )}
        </div>

        {open && (
          <nav
            aria-label={labels.nav}
            className="-mx-2 flex h-11 items-center gap-6 overflow-x-auto px-2 md:hidden"
          >
            {linkList}
          </nav>
        )}
      </header>
    </div>
  )
}
