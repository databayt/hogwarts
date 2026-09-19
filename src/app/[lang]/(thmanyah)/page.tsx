// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"
import { preload } from "react-dom"

import { Chatbot } from "@/components/chatbot"
import {
  localeConfig,
  type Locale,
} from "@/components/internationalization/config"
import { AccessCheck } from "@/components/saas-marketing/access-check"
import { HomeTemplate } from "@/components/saas-marketing/thmanyah/template/HomeTemplate"

/**
 * The SaaS marketing homepage — font.thmanyah.com's homepage reproduced 1:1.
 *
 * It lives in its own route group rather than under `(saas-marketing)` on
 * purpose: the reference renders no site header (its nav does not exist on the
 * homepage) and ships its own footer, so the shared marketing layout's
 * SiteHeader / SiteFooter chrome would break the mirror. Two things that
 * layout contributed are still wanted and are re-mounted below: AccessCheck's
 * `?access=denied` toast, fired when the dashboard bounces someone back here,
 * and the Chatbot — mounted with the same props the shared layout used
 * (`promptType="saasMarketing"`).
 *
 * The Chatbot sits OUTSIDE `.thmanyah-shell` deliberately. The clone carries
 * the reference's document reset scoped to that wrapper, and it targets
 * `input, textarea, select, button` — every control the chat window is built
 * from. Inside the shell the FAB and the message input would inherit it. The
 * FAB is fixed-position, so being a sibling costs nothing, and outside the
 * shell it also inherits the document's real `dir` instead of the clone's
 * pinned RTL.
 *
 * The shell's `dir`/`lang` follow the ROUTE. They used to be pinned to Arabic
 * RTL at every locale — the reference has no English variant and the whole
 * layout is authored right-to-left — which meant `/en` served an Arabic page.
 * It is set explicitly rather than inherited because the prerendered <html>
 * carries the default locale (`ar`/`rtl`) until the root layout's corrective
 * inline script runs. Nothing inside the clone reads Radix's direction context
 * (only `Slot`, which has none), so no DirectionProvider is needed — and
 * mounting one here would mutate `document.documentElement.dir` for the rest
 * of the session.
 *
 * Copy for both locales lives in `thmanyah/lib/copy.ts`; the mirrored
 * geometry lives at the end of `thmanyah-clone.css` under
 * `.thmanyah-shell[dir="ltr"]`, so the Arabic page is untouched by it.
 *
 * Styles: `src/styles/thmanyah-clone.css`, loaded from the root layout
 * alongside the other clone sheets and scoped to `.thmanyah-shell`.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = (lang === "en" ? "en" : "ar") as Locale
  const dir = localeConfig[locale].dir

  // The two faces the first viewport actually draws with, and nothing else.
  // `thmanyah-clone.css` declares fifteen @font-face rules (3 families x 5
  // weights) and the browser discovers all of them only after fetching and
  // parsing that stylesheet — so the hero's own text was starting its font
  // download a full stylesheet-round-trip late, rendered in a fallback, then
  // reflowed when the real face landed. That swap is the "disturbance".
  //
  // Preloading hoists these two into the document's initial response, so they
  // download in parallel with the CSS instead of after it, and are already in
  // memory when first paint happens. The other thirteen are below the fold and
  // are deliberately left to be discovered normally.
  //
  // `crossOrigin: "anonymous"` is required even though these are same-origin:
  // fonts are always fetched in CORS mode, and a preload without it does not
  // match the later font request — you get the file twice instead of once.
  //
  //   sans 400  -> the hero's "منصة بالقلم" title
  //   display 900 -> the "نظام" h1, which is this page's LCP element
  preload("/fonts/thmanyah-sans-regular.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  })
  preload("/fonts/thmanyah-serif-display-black.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  })

  return (
    <>
      <div className="thmanyah-shell" dir={dir} lang={locale}>
        <Suspense fallback={null}>
          <AccessCheck />
        </Suspense>
        <HomeTemplate lang={locale} />
      </div>
      <Chatbot lang={locale} promptType="saasMarketing" />
    </>
  )
}
