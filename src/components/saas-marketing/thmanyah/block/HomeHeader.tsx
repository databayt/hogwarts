"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import Link from "next/link"
import { X } from "lucide-react"

import type { MenuColumn } from "@/components/saas-marketing/thmanyah/lib/menu"

/**
 * The homepage's header. At rest it is nothing but a short two-line hamburger,
 * fixed at the start edge over the hero (ported from ~/farm's homepage
 * header), so the full-screen green hero is never cut by a bar. Once the hero
 * has mostly scrolled away the button gets a white disc, so it stays legible
 * over the black bands below.
 *
 * Clicking it brings the header itself in: a white bar slides down from the
 * top edge in nike.com's shape (~/nike/src/components/site/header) — brand,
 * the page links in the middle, the actions at the end — and hovering or
 * focusing "Features" opens the full-width mega-menu under it, one column per
 * /features group. Below `lg` the links take a second, scrollable row and the
 * mega-menu stays shut (no hover on a phone; Features opens the page).
 *
 * The bar is a native popover: Escape, a click anywhere outside and the top
 * layer come with it, no dialog library. It must sit OUTSIDE
 * `.thmanyah-shell` — the clone's scoped reset restyles every `button`.
 */

const LABELS = {
  ar: {
    open: "افتح القائمة",
    close: "أغلق القائمة",
    brand: "بالقلم",
    nav: "التنقل الرئيسي",
    pages: [
      ["المميزات", "/features"],
      ["المجتمع", "/community"],
      ["التسعير", "/pricing"],
      ["الوثائق", "/docs"],
    ],
    login: "تسجيل الدخول",
    start: "ابدأ شهرك المجاني",
    startShort: "ابدأ مجانًا",
    other: "English",
  },
  en: {
    open: "Open menu",
    close: "Close menu",
    brand: "balqalam",
    nav: "Main navigation",
    pages: [
      ["Features", "/features"],
      ["Community", "/community"],
      ["Pricing", "/pricing"],
      ["Documentation", "/docs"],
    ],
    login: "Sign in",
    start: "Start your free month",
    startShort: "Start free",
    other: "العربية",
  },
} as const

/* nike's nav item: a 2px underline that grows from the centre on hover. */
const NAV_LINK =
  "relative flex h-full items-center text-base font-medium text-black after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-black after:transition-transform after:duration-200 hover:after:scale-x-100 group-hover:after:scale-x-100"
const ACTION =
  "text-[15px] font-medium text-neutral-500 transition-colors hover:text-black"

export function HomeHeader({
  lang,
  columns,
}: {
  lang: "ar" | "en"
  columns: MenuColumn[]
}) {
  const t = LABELS[lang]
  const other = lang === "ar" ? "en" : "ar"
  const dir = lang === "ar" ? "rtl" : "ltr"
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
      dir={dir}
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
        dir={dir}
        className="pointer-events-auto fixed inset-x-0 top-0 bottom-auto m-0 w-full max-w-none -translate-y-full overflow-visible border-0 bg-white p-0 text-black shadow-[0_1px_0_rgb(0_0_0/0.06)] transition-[translate,overlay,display] transition-discrete duration-300 ease-out backdrop:bg-transparent open:translate-y-0 motion-reduce:transition-none starting:open:-translate-y-full"
      >
        <div className="relative flex h-[60px] items-center justify-between gap-4 px-4 lg:px-12">
          <Link
            href={`/${lang}`}
            onClick={close}
            className="text-lg font-semibold"
          >
            {t.brand}
          </Link>

          <nav aria-label={t.nav} className="hidden h-full lg:block">
            <ul className="flex h-full items-center gap-x-6">
              {t.pages.map(([label, href], i) => (
                <li key={href} className="group flex h-full items-center">
                  <Link
                    href={`/${lang}${href}`}
                    prefetch={false}
                    onClick={close}
                    className={NAV_LINK}
                    aria-haspopup={i === 0 ? "menu" : undefined}
                  >
                    {label}
                  </Link>
                  {i === 0 && (
                    <MegaMenu
                      columns={columns}
                      label={label}
                      onNavigate={close}
                    />
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-x-4">
            <a
              href={`/${other}`}
              hrefLang={other}
              lang={other}
              className={`${ACTION} hidden sm:block`}
            >
              {t.other}
            </a>
            <Link
              href={`/${lang}/login`}
              prefetch={false}
              onClick={close}
              className={`${ACTION} hidden sm:block`}
            >
              {t.login}
            </Link>
            <Link
              href={`/${lang}/onboarding`}
              prefetch={false}
              onClick={close}
              className="rounded-full bg-black px-4 py-2 text-[15px] font-medium text-white transition-opacity hover:opacity-80"
            >
              <span className="hidden md:inline">{t.start}</span>
              <span className="md:hidden">{t.startShort}</span>
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
        </div>

        {/* Below lg: the links (and, on a phone, sign-in + language) in a
            second row that scrolls sideways rather than wrapping. */}
        <nav
          aria-label={t.nav}
          className="flex h-11 items-center gap-x-6 overflow-x-auto border-t border-neutral-100 px-4 whitespace-nowrap lg:hidden"
        >
          {t.pages.map(([label, href]) => (
            <Link
              key={href}
              href={`/${lang}${href}`}
              prefetch={false}
              onClick={close}
              className="text-[15px] font-medium text-black"
            >
              {label}
            </Link>
          ))}
          <Link
            href={`/${lang}/login`}
            prefetch={false}
            onClick={close}
            className={`${ACTION} sm:hidden`}
          >
            {t.login}
          </Link>
          <a
            href={`/${other}`}
            hrefLang={other}
            lang={other}
            className={`${ACTION} sm:hidden`}
          >
            {t.other}
          </a>
        </nav>
      </div>
    </header>
  )
}

/**
 * nike's mega-menu: a full-width panel anchored under the bar, opened purely
 * by the parent `li.group` hover / focus-within — no client state.
 */
function MegaMenu({
  columns,
  label,
  onNavigate,
}: {
  columns: MenuColumn[]
  label: string
  onNavigate: () => void
}) {
  return (
    <div
      role="menu"
      aria-label={label}
      className="invisible absolute inset-x-0 top-full z-40 translate-y-1 border-t border-neutral-100 bg-white opacity-0 shadow-[0_16px_24px_-12px_rgba(0,0,0,0.12)] transition-[opacity,translate,visibility] duration-200 ease-out group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-6 gap-x-10 px-6 py-9">
        {columns.map((column) => (
          <div key={column.title} className="min-w-0">
            <Link
              href={column.href}
              role="menuitem"
              prefetch={false}
              onClick={onNavigate}
              className="mb-3 block text-[15px] font-medium text-black hover:text-neutral-600"
            >
              {column.title}
            </Link>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    role="menuitem"
                    prefetch={false}
                    onClick={onNavigate}
                    className="block text-[15px] leading-none text-neutral-500 transition-colors hover:text-black"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
