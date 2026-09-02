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
 * There is no hero PHOTOGRAPH. The reference's banner is a promotional
 * creative — photographed athletes, club kit, third-party logos — and none of
 * that is ours to carry, so what this rebuilds is the banner's visual
 * language, not its picture: the near-black ground, the angular bright-green
 * field driven into the inline-end side, the white two-line headline with one
 * phrase in extrabold, and the white pill under it. The rest of the page's
 * imagery is catalog artwork on the session cards below — real, per-subject,
 * and already paid for.
 *
 * The colours are sampled from the reference banner rather than guessed:
 * `#000d04` ground, `#045238` for the deeper plane. The bright wedge is OURS
 * — the بالقلم `#00bc6d` rather than the reference's `#00dd76`, because that
 * is the one part of the composition the brand actually owns.
 *
 * Literal hexes on purpose. This is a brand ground, not a themed surface: it
 * does NOT invert, and every piece of ink on it is pinned light rather than
 * tokenised. Nothing here may use `primary-foreground` — on this ground that
 * token is white in light mode and black in dark, which is exactly backwards.
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
      <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden rounded-[36px] bg-[#000d04] px-8 py-10 text-white sm:px-12 lg:min-h-[259px] lg:flex-row lg:items-center lg:py-12">
        <BannerField />

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
            <p className="mt-4 max-w-[52ch] text-lg text-white/75">
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
 * The banner's angular green field.
 *
 * The reference drives a bright wedge into one side of a near-black card and
 * cuts it back with straight diagonals and one large curve; the photograph
 * sits on top of that field. This is the field WITHOUT the photograph — the
 * composition is the part that belongs to the layout, and it is the part a
 * school's banner can carry honestly.
 *
 * Positioned on the inline-END side, so it lands where the reference puts it
 * on an Arabic page (physical left) and mirrors to the right on /en. Inside
 * the wrapper every coordinate is PHYSICAL on purpose: `clip-path` has no
 * logical form, so mixing logical offsets with physical polygons would send
 * half the composition the wrong way. The whole wrapper flips instead.
 *
 * Hidden below md, where the card stacks and a 46% field would sit under the
 * headline rather than beside it.
 */
function BannerField() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 end-0 -z-10 hidden w-[40%] max-w-[470px] overflow-hidden md:block ltr:-scale-x-100"
      aria-hidden="true"
    >
      {/* The deeper plane, then the brand wedge over it — the field's outer
          edge slopes toward the type rather than ending square. */}
      <div
        className="absolute inset-0 bg-[#045238]"
        style={{ clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)" }}
      />
      <div
        className="absolute inset-0 bg-[#00bc6d]"
        style={{ clipPath: "polygon(0 0, 88% 0, 55% 100%, 0 100%)" }}
      />

      {/* Three cuts back to the ground: a corner at each end of the field and
          one curve through it. */}
      <div
        className="absolute inset-0 bg-[#000d04]"
        style={{ clipPath: "polygon(0 0, 36% 0, 0 50%)" }}
      />
      <div
        className="absolute inset-0 bg-[#000d04]"
        style={{ clipPath: "polygon(0 100%, 32% 100%, 0 62%)" }}
      />
      <div className="absolute -top-[62%] left-[26%] aspect-square w-[58%] rounded-full bg-[#000d04]" />
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
 * The reference hero's CTA: a white pill with dark ink on the dark ground,
 * pinned like everything else on this banner so it reads the same in both
 * themes. A token pair would invert in dark mode and lose the contrast the
 * ground was chosen for.
 */
function pill(variant: "default" | "ghost") {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5",
    "text-sm font-medium whitespace-nowrap transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-white/50",
    variant === "default"
      ? "bg-white text-[#000d04] hover:bg-white/90"
      : "text-white/75 hover:bg-white/10 hover:text-white"
  )
}
