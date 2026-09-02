// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: prop composition only, so none of it reaches the client.
import Link from "next/link"

import { cn } from "@/lib/utils"
import { CDN_IMAGES } from "@/components/saas-marketing/thmanyah/lib/cdn-assets"

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
 * The COMPOSITION is the reference's: type on one side, a photograph filling
 * the other, its inner edge cut on a diagonal so the picture drives into the
 * ground rather than sitting in a box. The PICTURE is not — that banner is a
 * promotional creative down to the photographed athletes, the club kit and the
 * third-party logos, none of which is ours to carry. Ours is a بالقلم
 * marketing photograph of students mid-lesson, already published to
 * cdn.databayt.org and already carried by the homepage, so it costs this page
 * one cached request and nothing else.
 *
 * The ground is the saas-marketing green `#00bc6d` — the one the marketing
 * hero is built on — with `#045238` behind the picture for depth, sampled from
 * the reference's own banner.
 *
 * Literal hexes on purpose. This is a brand ground, not a themed surface: it
 * does NOT invert, and every piece of ink on it is pinned DARK rather than
 * tokenised — white on `#00bc6d` measures about 2.5:1 and is unreadable, which
 * is why the marketing hero pairs this green with black. Nothing here may use
 * `primary-foreground`: on this ground that token is white in light mode and
 * black in dark, which is exactly backwards.
 *
 * The card's geometry is the reference banner's, measured: 1170px of
 * container at a 36px radius, 259px tall, 32px of air under it.
 */
export function LiveStatusHero({
  dictionary,
  lang,
  viewer,
  policy,
}: HeroProps) {
  const d = dictionary?.landing

  return (
    <section className="mb-8">
      <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-[36px] bg-[#00bc6d] px-8 py-10 text-[#050505] sm:px-12 lg:min-h-[259px] lg:flex-row lg:items-center lg:py-12">
        <BannerPicture />

        <div className="relative min-w-0">
          {/* Two lines of ~7 words inside a ~420px measure, at the
              reference's ~38px — its own headline is 4 words over 3, with the
              emphasis carried by WEIGHT inside an otherwise light line rather
              than by a highlight.

              The face is thmanyah sans, already vendored in `public/fonts/`
              and declared by `src/styles/thmanyah-clone.css`, which the ROOT
              layout imports — so it is available here without this page
              loading anything of its own. It ships five weights (300 · 400 ·
              500 · 700 · 900) and this line uses two of them: 300 for the
              sentence, 700 for the phrase that carries it. A weight the family
              does not have would be synthesised by the browser and lose the
              face's own drawing, which is the whole reason to use it. */}
          <h1
            className="max-w-[16ch] text-3xl leading-[1.35] font-light text-balance sm:text-4xl lg:max-w-[420px] lg:text-[38px]"
            style={{ fontFamily: '"thmanyah sans", sans-serif' }}
          >
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
            <SecondaryAction
              d={d}
              lang={lang}
              viewer={viewer}
              policy={policy}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
/**
 * The banner's picture panel.
 *
 * The reference fills one side of its card with a photograph whose inner edge
 * is cut on a diagonal, so the picture drives into the ground instead of
 * sitting in a rectangle, with a deeper plane showing through behind it. That
 * arrangement is what this reproduces; the photograph itself is ours.
 *
 * `modern-06` is a بالقلم marketing shot of students working through a lesson
 * together — already published to cdn.databayt.org for the homepage, so it is
 * a cached request rather than a new asset, and it is the one picture in that
 * set that shows a class actually happening.
 *
 * The panel sits on the inline-END side, where the reference puts it on an
 * Arabic page. It is NOT mirrored by a transform, unlike the abstract field it
 * replaces: flipping the wrapper would flip the PHOTOGRAPH, and a mirrored
 * photograph of real people is a different picture. So the diagonal is written
 * twice instead — the `ltr:` variant carries the mirrored polygon — and the
 * image is never transformed at all.
 *
 * Hidden below md, where the card stacks and a 44% panel would sit under the
 * headline rather than beside it.
 */
function BannerPicture() {
  // The inner edge, cut once per direction. In RTL the panel is on the
  // physical left, so the slope runs down its right edge; in LTR both are
  // reflected about the panel's centre.
  const cut =
    "[clip-path:polygon(0_0,100%_0,78%_100%,0_100%)] ltr:[clip-path:polygon(0_0,100%_0,100%_100%,22%_100%)]"

  return (
    <div
      className="pointer-events-none absolute inset-y-0 end-0 -z-10 hidden w-[44%] max-w-[520px] md:block"
      aria-hidden="true"
    >
      {/* The deeper plane, offset so it shows past the picture's diagonal the
          way the reference's field does behind its own. */}
      <div
        className={cn(
          "absolute inset-0 bg-[#045238]",
          "[clip-path:polygon(0_0,100%_0,92%_100%,0_100%)] ltr:[clip-path:polygon(0_0,100%_0,100%_100%,8%_100%)]"
        )}
      />

      <picture>
        <source srcSet={CDN_IMAGES["modern-06"].avif} type="image/avif" />
        <source srcSet={CDN_IMAGES["modern-06"].webp} type="image/webp" />
        <img
          src={CDN_IMAGES["modern-06"].webp}
          alt=""
          decoding="async"
          draggable={false}
          className={cn("absolute inset-0 h-full w-full object-cover", cut)}
        />
      </picture>
    </div>
  )
}
/**
 * Two buttons, never more, and every label a single word.
 *
 * The banner offered four — sessions, schedule, recordings, settings — which
 * is a menu, and the page already has two of those (the tab strip above the
 * `(app)` surfaces, and the role guide below, which lists every route this
 * role can open, with a description each). A hero earns one obvious action and
 * at most one alternative; the rest of the map lives where a map belongs.
 *
 * Primary is the list of classes, for every role. Joining the one that is
 * running is the strip's job — its cards go straight into the room — so a hero
 * "Join" would be the same action twice, pointing at whichever session the
 * server happened to rank first. ACCOUNTANT may list sessions but may neither
 * join one nor watch a recording, so the list is right for it too.
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
 * The one alternative, chosen by role rather than stacked.
 *
 * Whoever can create a class is here to create one; whoever cannot is most
 * likely here for a lesson they missed; an admin who can do neither is here
 * for the policy. First match wins, and a role that matches nothing gets a
 * single button — which is a perfectly good hero.
 *
 * Settings and the network test stay one click away in the tab strip and the
 * role guide, so nothing is lost by not repeating them here.
 */
function SecondaryAction({
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
  // An offline school's one action is turning it on. Anything beside that
  // button is a distraction from the only thing that changes the page.
  if (!policy.isOnline) return null

  if (viewer.canSchedule) {
    return (
      <Link className={pill("ghost")} href={`/${lang}/live/schedule`}>
        {d?.actions?.schedule}
      </Link>
    )
  }

  // Same destination as the role guide's recordings card — the ended-sessions
  // filter, not a route of its own.
  if (viewer.canViewRecordings) {
    return (
      <Link
        className={pill("ghost")}
        href={`/${lang}/live/dashboard?status=ended`}
      >
        {d?.actions?.recordings}
      </Link>
    )
  }

  if (viewer.canConfigure) {
    return (
      <Link className={pill("ghost")} href={`/${lang}/live/settings`}>
        {d?.actions?.settings}
      </Link>
    )
  }

  return null
}

/**
 * The headline, with its last phrase carrying the weight.
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
      <strong className="font-bold">{mark}</strong>
      {after}
    </>
  )
}

/**
 * The homepage's small pill button, rather than a full-width one — a compact
 * action reads as a tool, a wide one reads as a landing page.
 *
 * The reference hero's CTA: a white pill with dark ink on the green ground,
 * pinned like everything else on this banner so it reads the same in both
 * themes. A token pair would invert in dark mode and lose the contrast the
 * ground was chosen for.
 */
function pill(variant: "default" | "ghost") {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5",
    "text-sm font-medium whitespace-nowrap transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-[#050505]/40",
    variant === "default"
      ? "bg-white text-[#050505] hover:bg-white/90"
      : "text-[#050505]/75 hover:bg-[#050505]/10 hover:text-[#050505]"
  )
}
