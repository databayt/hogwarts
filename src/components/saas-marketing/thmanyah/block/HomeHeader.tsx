"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The homepage's header: nothing but a short two-line hamburger, fixed at the
 * start edge over the hero, that opens the site menu full screen — the farm
 * site's homepage header (~/farm/src/components/home/header.tsx), ported.
 *
 * Why not the shared SiteHeader: a white bar on top of a full-screen green
 * hero cuts it, and pushes the hero's CTA out of the first viewport. This one
 * draws no bar. Over the hero the lines are black on green; once the hero has
 * mostly scrolled away the button gets a white disc, so it stays legible over
 * the black bands below.
 *
 * The panel is a native popover: Escape, click-outside and the top layer come
 * with it, no dialog library. It must sit OUTSIDE `.thmanyah-shell` — the
 * clone's scoped reset restyles every `button`.
 */

const LABELS = {
  ar: {
    open: "افتح القائمة",
    close: "أغلق القائمة",
    brand: "بالقلم",
    pages: [
      ["المميزات", "/features"],
      ["المجتمع", "/community"],
      ["التسعير", "/pricing"],
      ["الوثائق", "/docs"],
    ],
    login: "تسجيل الدخول",
    start: "ابدأ شهرك المجاني",
    other: "English",
  },
  en: {
    open: "Open menu",
    close: "Close menu",
    brand: "balqalam",
    pages: [
      ["Features", "/features"],
      ["Community", "/community"],
      ["Pricing", "/pricing"],
      ["Documentation", "/docs"],
    ],
    login: "Sign in",
    start: "Start your free month",
    other: "العربية",
  },
} as const

export function HomeHeader({ lang }: { lang: "ar" | "en" }) {
  const t = LABELS[lang]
  const other = lang === "ar" ? "en" : "ar"
  const id = React.useId()
  const ref = React.useRef<HTMLElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const close = () => panel.current?.hidePopover()

  React.useEffect(() => {
    const header = ref.current
    if (!header) return
    let frame = 0
    const update = () =>
      header.toggleAttribute(
        "data-solid",
        window.scrollY > window.innerHeight * 0.6
      )
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

  const row =
    "flex items-center py-2 transition-opacity hover:opacity-60 focus-visible:opacity-60"

  return (
    <header
      ref={ref}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="group/header pointer-events-none fixed inset-x-0 top-0 z-50 h-14 text-black"
    >
      <div className="flex h-full w-full items-center justify-start px-4 md:px-10">
        <button
          type="button"
          popoverTarget={id}
          aria-label={t.open}
          className="pointer-events-auto -ms-2 inline-grid size-11 place-items-center rounded-full transition-colors duration-300 group-data-[solid]/header:bg-white/90 group-data-[solid]/header:backdrop-blur-md"
        >
          <span aria-hidden className="flex w-4 flex-col gap-1.5">
            <span className="h-0.5 rounded-full bg-current" />
            <span className="h-0.5 rounded-full bg-current" />
          </span>
        </button>
      </div>

      <div
        ref={panel}
        id={id}
        popover="auto"
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="bg-background text-foreground pointer-events-auto fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto border-0 p-0 opacity-0 transition-[opacity,overlay,display] transition-discrete duration-300 ease-out open:opacity-100 motion-reduce:transition-none starting:open:opacity-0"
      >
        <div className="flex h-14 items-center justify-between border-b px-4 md:px-10">
          <Link
            href={`/${lang}`}
            onClick={close}
            className="text-lg font-semibold"
          >
            {t.brand}
          </Link>
          <button
            type="button"
            popoverTarget={id}
            popoverTargetAction="hide"
            aria-label={t.close}
            className="-me-2 inline-grid size-11 place-items-center rounded-full"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl flex-col px-4 py-8 text-2xl font-medium tracking-tight md:grid md:grid-cols-2 md:gap-x-16 md:px-10 md:py-16 md:text-4xl">
          {t.pages.map(([label, href]) => (
            <Link
              key={href}
              href={`/${lang}${href}`}
              prefetch={false}
              onClick={close}
              className={row}
            >
              {label}
            </Link>
          ))}
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-6 text-base md:col-span-2 md:text-lg">
            <Link
              href={`/${lang}/onboarding`}
              prefetch={false}
              onClick={close}
              className="bg-foreground text-background rounded-full px-5 py-2.5 font-medium transition-opacity hover:opacity-80"
            >
              {t.start}
            </Link>
            <Link
              href={`/${lang}/login`}
              prefetch={false}
              onClick={close}
              className={cn(row, "text-muted-foreground")}
            >
              {t.login}
            </Link>
            <a
              href={`/${other}`}
              hrefLang={other}
              lang={other}
              className={cn(row, "text-muted-foreground")}
            >
              {t.other}
            </a>
          </div>
        </nav>
      </div>
    </header>
  )
}
