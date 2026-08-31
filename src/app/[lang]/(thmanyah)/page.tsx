// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Suspense } from "react"

import { Chatbot } from "@/components/chatbot"
import { type Locale } from "@/components/internationalization/config"
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
export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return (
    <>
      <div className="thmanyah-shell" dir="rtl" lang="ar">
        <Suspense fallback={null}>
          <AccessCheck />
        </Suspense>
        <HomeTemplate lang={lang} />
      </div>
      <Chatbot lang={lang as Locale} promptType="saasMarketing" />
    </>
  )
}
