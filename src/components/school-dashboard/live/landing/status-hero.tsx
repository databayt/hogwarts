// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: prop composition only, so none of it reaches the client.
import Link from "next/link"

import { cn } from "@/lib/utils"

import type { LandingPolicy, LandingSectionProps, LandingViewer } from "./types"

interface HeroProps extends LandingSectionProps {
  viewer: LandingViewer
  policy: LandingPolicy
}

/**
 * The page's opening: a headline that says what live classes ARE for this
 * school, and the ways in.
 *
 * No eyebrow and, when the school is online, no supporting sentence — the
 * banner is one line of type over its buttons. The block name was already in
 * the page heading and the sidebar, and the paragraph under it explained the
 * product to people who are here to join a class.
 *
 * It is deliberately NOT a status board. An earlier version put the live-now
 * state in the `<h1>` ("one class is live right now" · "hybrid teaching" ·
 * "Join now"), which made the banner a duplicate of the strip directly beneath
 * it — and a worse one, since the strip names the subject, the section and the
 * time. The current class belongs to that strip; the hero states the offer.
 * The one state it still branches on is whether the school teaches online at
 * all, because that changes what the page IS, not merely what is on today.
 *
 * There is no hero image. The imagery on this page is the catalog artwork on
 * the session cards below — real, per-subject, and already paid for — rather
 * than one stock photograph standing in for every class.
 *
 * The shell is the wide `rounded-[36px]` banner card thmanyah.com opens with —
 * its proportions and corner radius, carrying our own content. It also takes
 * that hero's colour triad whole: the بالقلم green `#00bc6d` as the ground,
 * black ink on it, and the mint `#9fe5b1` mark behind the phrase the headline
 * lands on. Literal hexes on purpose — this is the brand ground, not a themed
 * surface, so it does NOT invert and every piece of ink on it is pinned dark
 * rather than tokenised. Nothing here may use `primary-foreground`: on a green
 * ground that token is white in light mode and black in dark, which is exactly
 * backwards.
 */
export function LiveStatusHero({
  dictionary,
  lang,
  viewer,
  policy,
}: HeroProps) {
  const d = dictionary?.landing

  return (
    <section className="mb-10">
      <div className="flex flex-col justify-between gap-8 rounded-[36px] bg-[#00bc6d] px-8 py-10 text-[#050505] sm:px-12 lg:min-h-[259px] lg:flex-row lg:items-center lg:py-12">
        <div className="min-w-0">
          <h1 className="max-w-[26ch] text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {policy.isOnline ? (
              <MarkedHeadline
                template={d?.hero?.title}
                mark={d?.hero?.titleMark}
              />
            ) : (
              d?.hero?.offline
            )}
          </h1>

          {/* Only the offline school gets a sentence: it has to be told why
              there is nothing here and what turns it on. An online school's
              banner is the headline alone — a paragraph restating the product
              to people already using it is noise above their own classes. */}
          {policy.isOnline ? null : (
            <p className="mt-4 max-w-[52ch] text-lg text-[#050505]/75">
              {viewer.canConfigure
                ? d?.hero?.offlineAdmin
                : d?.hero?.offlineOther}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <PrimaryAction d={d} lang={lang} viewer={viewer} policy={policy} />

            {viewer.canSchedule && policy.isOnline ? (
              <Link className={pill("ghost")} href={`/${lang}/live/schedule`}>
                {d?.actions?.schedule}
              </Link>
            ) : null}

            {viewer.canConfigure ? (
              <Link className={pill("ghost")} href={`/${lang}/live/settings`}>
                {d?.actions?.settings}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * The way in — the whole list, not one particular class.
 *
 * Joining the class that is running now is the strip's job (its cards carry a
 * Join straight into the room); a hero button labelled "Join now" alongside it
 * was the same action twice, and it pointed at whichever session the server
 * happened to rank first.
 *
 * ACCOUNTANT may list sessions but may neither join one nor watch a recording,
 * so the list is the correct destination for it too.
 */
function PrimaryAction({
  d,
  lang,
  viewer,
  policy,
}: {
  d: NonNullable<LandingSectionProps["dictionary"]>["landing"]
  lang: string
  viewer: LandingViewer
  policy: LandingPolicy
}) {
  if (!policy.isOnline) {
    return viewer.canConfigure ? (
      <Link className={pill("default")} href={`/${lang}/live/settings`}>
        {d?.actions?.turnOn}
      </Link>
    ) : null
  }

  return (
    <Link className={pill("default")} href={`/${lang}/live/dashboard`}>
      {d?.actions?.viewSessions}
    </Link>
  )
}

/**
 * The headline, with its last phrase on the mint mark.
 *
 * The phrase travels as its own dictionary key rather than as markup inside
 * the sentence: an Arabic translator moving it would otherwise have to carry
 * tags through a right-to-left string, and a stray one would render as text.
 * A template with no `{mark}` simply renders unmarked.
 */
function MarkedHeadline({
  template,
  mark,
}: {
  template?: string
  mark?: string
}) {
  if (!template) return null
  const [before, after] = template.split("{mark}")

  if (after === undefined || !mark) return <>{template}</>

  return (
    <>
      {before}
      <LiveMark>{mark}</LiveMark>
      {after}
    </>
  )
}

/**
 * The homepage's mint highlight mark, behind the phrase the headline lands on.
 *
 * Mint on green under dark ink is the reference hero's own pairing, not an
 * invention: `#9fe5b1` is the بالقلم brand mint and it is drawn to sit on the
 * `#00bc6d` ground. Literal hexes for the same reason the banner uses them —
 * neither colour inverts, so neither may be tokenised.
 *
 * `isolate` is load-bearing: without a stacking context of its own, the mark's
 * `-z-10` sends it BEHIND the banner's own green ground and it disappears.
 */
function LiveMark({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative isolate inline-block">
      <span
        aria-hidden="true"
        className="absolute inset-x-[-0.1em] inset-y-[0.06em] -z-10 bg-[#9fe5b1]"
      />
      <span className="relative text-[#050505]">{children}</span>
    </span>
  )
}

/**
 * The homepage's small pill button, rather than a full-width one — a compact
 * action reads as a tool, a wide one reads as a landing page.
 *
 * The reference hero's CTA: a black pill with white ink on the green ground,
 * pinned like everything else on this banner so it reads the same in both
 * themes. A token pair would flip to white-on-green in dark mode and lose the
 * contrast the ground was chosen for.
 */
function pill(variant: "default" | "ghost") {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5",
    "text-sm font-medium whitespace-nowrap transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-[#050505]/40",
    variant === "default"
      ? "bg-[#050505] text-white hover:bg-[#050505]/85"
      : "text-[#050505]/75 hover:bg-[#050505]/10 hover:text-[#050505]"
  )
}
