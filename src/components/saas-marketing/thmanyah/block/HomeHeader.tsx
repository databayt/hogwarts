"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"

import type { MenuColumn } from "@/components/saas-marketing/thmanyah/lib/menu"

/**
 * The homepage's header: nothing but a short two-line hamburger, fixed at the
 * start edge over the hero (ported from ~/farm/src/components/home/header.tsx).
 *
 * Why not the shared SiteHeader: a white bar on top of a full-screen green
 * hero cuts it, and pushes the hero's CTA out of the first viewport. This one
 * draws no bar. Over the hero the lines are black on green; once the hero has
 * mostly scrolled away the button gets a white disc, so it stays legible over
 * the black bands below.
 *
 * The menu drops down like nike.com's mega-menu (~/nike/src/components/site/
 * header/mega-menu.tsx): a full-width white panel from the top edge, the pages
 * in the first column, then one column per /features group with its modules,
 * and the page below dimmed. It is a native popover: Escape, click-outside and
 * the top layer come with it, no dialog library. The header must sit OUTSIDE
 * `.thmanyah-shell` — the clone's scoped reset restyles every `button`.
 */

const LABELS = {
  ar: {
    open: "افتح القائمة",
    close: "أغلق القائمة",
    brand: "بالقلم",
    platform: "المنصة",
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
    platform: "Platform",
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

const TITLE =
  "mb-3 block text-[15px] font-medium text-black transition-colors hover:text-neutral-600"
const LINK =
  "block text-[15px] leading-none text-neutral-500 transition-colors hover:text-black"

export function HomeHeader({
  lang,
  columns,
}: {
  lang: "ar" | "en"
  columns: MenuColumn[]
}) {
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
        className="pointer-events-auto fixed inset-x-0 top-0 bottom-auto m-0 max-h-dvh w-full max-w-none -translate-y-2 overflow-y-auto border-0 bg-white p-0 text-black opacity-0 shadow-[0_16px_24px_-12px_rgba(0,0,0,0.12)] transition-[opacity,translate,overlay,display] transition-discrete duration-200 ease-out backdrop:bg-black/30 open:translate-y-0 open:opacity-100 motion-reduce:transition-none starting:open:-translate-y-2 starting:open:opacity-0"
      >
        <div className="flex h-14 items-center justify-between px-4 md:px-10">
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
            className="-me-2 inline-grid size-11 place-items-center rounded-full transition-colors hover:bg-neutral-100"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-8 gap-y-8 px-6 pt-4 pb-9 sm:grid-cols-4 lg:grid-cols-7 lg:gap-x-10">
          <div className="min-w-0">
            <span className={TITLE}>{t.platform}</span>
            <ul className="space-y-2.5">
              {t.pages.map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={`/${lang}${href}`}
                    prefetch={false}
                    onClick={close}
                    className={LINK}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {columns.map((column) => (
            <div key={column.title} className="min-w-0">
              <Link
                href={column.href}
                prefetch={false}
                onClick={close}
                className={TITLE}
              >
                {column.title}
              </Link>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      onClick={close}
                      className={LINK}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-neutral-200">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-6 gap-y-3 px-6 py-5 text-[15px]">
            <Link
              href={`/${lang}/onboarding`}
              prefetch={false}
              onClick={close}
              className="rounded-full bg-black px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-80"
            >
              {t.start}
            </Link>
            <Link
              href={`/${lang}/login`}
              prefetch={false}
              onClick={close}
              className="font-medium text-neutral-500 transition-colors hover:text-black"
            >
              {t.login}
            </Link>
            <a
              href={`/${other}`}
              hrefLang={other}
              lang={other}
              className="font-medium text-neutral-500 transition-colors hover:text-black"
            >
              {t.other}
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
