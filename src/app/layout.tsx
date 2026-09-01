// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { preconnect } from "react-dom"

import { fontRubik, fontThmanyahText } from "@/components/atom/fonts"
import {
  i18n,
  isRTL,
  type Locale,
} from "@/components/internationalization/config"

import "./globals.css"
import "@/styles/zenda-clone.css"
import "@/styles/zenda-shell.css"
import "@/styles/apple-clone.css"
import "@/styles/thmanyah-clone.css"

export const metadata: Metadata = {
  title: "balqalam",
  description: "School automation",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Skip the dynamic request APIs during `next build` page-data collection.
  // headers()/cookies() are dynamic APIs, and reading them HERE — in the root
  // layout, above every route in the app — opted the whole tree out of static
  // generation. That is why `/en` came back `private, no-cache, no-store` with
  // `x-vercel-cache: MISS` and a ~930ms TTFB: the marketing homepage was
  // re-rendered on the server for every visitor. `[lang]/layout.tsx` already
  // guards its own auth()/headers() calls this way and exports
  // generateStaticParams; this layout was the one holding the door open.
  //
  // Skipping is safe because the value is only ever a first guess. The
  // corrective inline script below re-derives lang/dir from the URL pathname
  // and writes them onto <html> synchronously in <head>, before the body is
  // parsed and before anything paints — so the prerendered attributes are
  // already replaced by the time they could matter. The only route without a
  // locale in its path is `/`, and that one just redirect()s to the default.
  let detected = ""
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    const headersList = await headers()
    const cookieStore = await cookies()
    detected =
      headersList.get("x-locale") || cookieStore.get("NEXT_LOCALE")?.value || ""
  }
  const locale: Locale = (i18n.locales as readonly string[]).includes(detected)
    ? (detected as Locale)
    : i18n.defaultLocale
  const dir = isRTL(locale) ? "rtl" : "ltr"

  // The corrective inline script is rendered server-side, so the locale list
  // and RTL set are interpolated from config — single source of truth.
  const localeAlternation = i18n.locales.join("|")
  const rtlLocales = JSON.stringify(i18n.locales.filter((l) => isRTL(l)))

  // Marketing images, illustrations, Lottie and lesson video all load straight
  // from the CDN — open the connection early, it matters on high-RTT links.
  preconnect(
    `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN?.trim() || "cdn.databayt.org"}`
  )

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontRubik.variable} ${fontThmanyahText.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var m=window.location.pathname.match(/^\\/(${localeAlternation})/);var l=m?m[1]:'${i18n.defaultLocale}';document.documentElement.lang=l;document.documentElement.dir=${rtlLocales}.indexOf(l)>-1?'rtl':'ltr'})()`,
          }}
        />
        {/*
          Drives --reveal-corner for the zenda footer reveal: the main wrapper's
          bottom corners are round while the footer is sliding into view and
          sharpen as it lands. Ported from zenda's own layout. Bails out when
          .main-wrapper / footer aren't on the page, so it costs a no-op scroll
          listener everywhere else.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var html = document.documentElement;
                var scrolled = false;
                var ticking = false;
                function clamp(v, lo, hi){ return v < lo ? lo : v > hi ? hi : v; }
                function update() {
                  ticking = false;
                  var mw = document.querySelector('.main-wrapper');
                  var footer = document.querySelector('.zenda-footer-slot');
                  if (!mw || !footer) return;
                  // The fixed overlap (computed padding-bottom) doubles as the
                  // max corner. It is 0 on mobile (reveal disabled), which
                  // zeroes the corner too.
                  var baseR = parseFloat(getComputedStyle(mw).paddingBottom) || 0;
                  if (baseR <= 0) { html.style.setProperty('--reveal-corner', '0px'); return; }
                  var mwBottom = mw.getBoundingClientRect().bottom;
                  var f = footer.getBoundingClientRect();
                  var denom = (f.bottom - f.top) - baseR;
                  var p = denom > 0 ? clamp((f.bottom - mwBottom) / denom, 0, 1) : 0;
                  // ease-in keeps the corner rounder through most of the reveal,
                  // then sharpens near the end so it visibly rests sharp.
                  var corner = baseR * (1 - p * p);
                  html.style.setProperty('--reveal-corner', corner.toFixed(2) + 'px');
                }
                function onScroll() {
                  if (!scrolled) { scrolled = true; html.classList.add('scrolled'); }
                  if (!ticking) { ticking = true; requestAnimationFrame(update); }
                }
                window.addEventListener('scroll', onScroll, { passive: true });
                window.addEventListener('resize', onScroll, { passive: true });
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function(){ requestAnimationFrame(update); });
                } else {
                  requestAnimationFrame(update);
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
