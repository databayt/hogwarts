// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"

import { AccessCheck } from "@/components/saas-marketing/access-check"
import { HomeTemplate } from "@/components/saas-marketing/thmanyah/template/HomeTemplate"

/**
 * The SaaS marketing homepage — font.thmanyah.com's homepage reproduced 1:1.
 *
 * It lives in its own route group rather than under `(saas-marketing)` on
 * purpose: the reference renders no site header (its nav does not exist on the
 * homepage) and ships its own footer, so the shared marketing layout's
 * SiteHeader / SiteFooter / Chatbot chrome would break the mirror. The one
 * thing that layout contributed and is still wanted — AccessCheck's
 * `?access=denied` toast, fired when the dashboard bounces someone back here —
 * is re-mounted below.
 *
 * The page is Arabic and RTL at every breakpoint, on `/ar` and `/en` alike:
 * the reference has no English variant and the whole layout is authored
 * right-to-left, so `dir` is pinned on the shell rather than inherited from
 * the locale. Nothing inside the clone reads Radix's direction context (only
 * `Slot`, which has none), so no DirectionProvider is needed — and pinning one
 * here would mutate `document.documentElement.dir` for the rest of the session.
 *
 * Styles: `src/styles/thmanyah-clone.css`, loaded from the root layout
 * alongside the other clone sheets and scoped to `.thmanyah-shell`.
 */
export default function Home() {
  return (
    <div className="thmanyah-shell" dir="rtl" lang="ar">
      <Suspense fallback={null}>
        <AccessCheck />
      </Suspense>
      <HomeTemplate />
    </div>
  )
}
