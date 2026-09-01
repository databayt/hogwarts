// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: prop composition only, so none of it reaches the client.
import Link from "next/link"
import { Radio } from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

import type {
  LandingPolicy,
  LandingSession,
  LandingSectionProps,
  LandingViewer,
} from "./types"

interface HeroProps extends LandingSectionProps {
  viewer: LandingViewer
  policy: LandingPolicy
  liveNow: number
  todayTotal: number
  /** The one session this viewer would act on — live if any, else the next up. */
  focus: LandingSession | null
}

/**
 * The page's opening: eyebrow, a headline that states what is happening, one
 * line of numbers, and the single action worth taking.
 *
 * The block name sits in the eyebrow rather than the `<h1>`, which is what
 * lets the headline carry the state. It also resolves a collision in the
 * name: "مباشر" is already this block's own label for a session that is
 * running, so as a bare `<h1>` it would have read as a status rather than a
 * section name.
 *
 * There is no hero image. The imagery on this page is the catalog artwork on
 * the session cards below — real, per-subject, and already paid for — rather
 * than one stock photograph standing in for every class.
 */
export function LiveStatusHero({
  dictionary,
  lang,
  viewer,
  policy,
  liveNow,
  todayTotal,
  focus,
}: HeroProps) {
  const d = dictionary?.landing
  const isLive = Boolean(focus?.isLive)

  return (
    <section className="pt-2 pb-10">
      <p className={cn(typographyVariants.hint, "mb-3")}>{dictionary?.title}</p>

      <h1 className="max-w-[18ch] text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
        {!policy.isOnline ? (
          d?.hero?.offline
        ) : liveNow > 0 ? (
          <CountedHeadline
            lang={lang}
            count={liveNow}
            forms={d?.hero?.liveCount}
          />
        ) : (
          d?.hero?.nothingLive
        )}
      </h1>

      {policy.isOnline ? (
        <p className={cn(typographyVariants.pageDescription, "mt-4")}>
          {[
            todayTotal > 0
              ? d?.hero?.todayCount?.replace(
                  "{count}",
                  formatCount(lang, todayTotal)
                )
              : null,
            !isLive && focus?.scheduledStart
              ? d?.hero?.nextAt?.replace("{time}", focus.scheduledStart)
              : null,
            deliveryLabel(d, policy),
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : (
        <p className={cn(typographyVariants.pageDescription, "mt-4")}>
          {viewer.canConfigure ? d?.hero?.offlineAdmin : d?.hero?.offlineOther}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <PrimaryAction
          d={d}
          lang={lang}
          viewer={viewer}
          policy={policy}
          focus={focus}
        />

        {viewer.canSchedule && policy.isOnline ? (
          <Link
            className={pill("ghost")}
            href={`/${lang}/live/schedule`}
          >
            {d?.actions?.schedule}
          </Link>
        ) : null}

        {viewer.canConfigure ? (
          <Link className={pill("ghost")} href={`/${lang}/live/settings`}>
            {d?.actions?.settings}
          </Link>
        ) : null}
      </div>
    </section>
  )
}

/**
 * The single most useful thing this viewer can do, and never more than one.
 *
 * When something is live it goes STRAIGHT into the room. The old landing sent
 * every join to the session detail page, which put a second click between a
 * student and a class that had already started.
 */
function PrimaryAction({
  d,
  lang,
  viewer,
  policy,
  focus,
}: {
  d: NonNullable<LandingSectionProps["dictionary"]>["landing"]
  lang: string
  viewer: LandingViewer
  policy: LandingPolicy
  focus: LandingSession | null
}) {
  if (!policy.isOnline) {
    return viewer.canConfigure ? (
      <Link className={pill("default")} href={`/${lang}/live/settings`}>
        {d?.actions?.turnOn}
      </Link>
    ) : null
  }

  // ACCOUNTANT may list sessions but may neither join one nor watch a
  // recording, so it is never offered a door it cannot walk through.
  if (focus && viewer.canJoin) {
    const href = focus.isLive
      ? `/${lang}/live/${focus.id}/room`
      : `/${lang}/live/${focus.id}`
    const label = focus.isLive
      ? viewer.isHost
        ? d?.actions?.start
        : viewer.role === "GUARDIAN"
          ? d?.actions?.observe
          : d?.actions?.join
      : d?.actions?.openNext
    return (
      <Link className={pill("default")} href={href}>
        {focus.isLive ? (
          <Radio className="size-4" aria-hidden="true" />
        ) : null}
        {label}
      </Link>
    )
  }

  return (
    <Link className={pill("default")} href={`/${lang}/live/dashboard`}>
      {d?.actions?.viewSessions}
    </Link>
  )
}

/**
 * A count and its sentence, agreeing in Arabic.
 *
 * Arabic inflects the counted noun five ways — one, two, 3–10, 11–99, and the
 * rest — so a single "{count} حصص" string is wrong for most numbers, including
 * the commonest one. `Intl.PluralRules` picks the form; the string is then
 * split on its `{count}` marker so the digits, and only the digits, get the
 * highlight mark. A form with no marker (Arabic's "one" and "two", which name
 * the quantity in the noun itself) simply renders without one.
 */
function CountedHeadline({
  lang,
  count,
  forms,
}: {
  lang: string
  count: number
  forms?: Record<string, string>
}) {
  const locale = lang === "ar" ? "ar" : "en"
  const category = new Intl.PluralRules(locale).select(count)
  const template = forms?.[category] ?? forms?.other ?? ""
  const [before, after] = template.split("{count}")

  if (after === undefined) return <>{template}</>

  return (
    <>
      {before}
      <LiveMark>{formatCount(lang, count)}</LiveMark>
      {after}
    </>
  )
}

/**
 * The homepage's mint highlight mark, behind the one number that matters.
 *
 * A literal hex on purpose, the same exception the lumos brand tiles take:
 * this is the بالقلم brand mint, drawn to sit under dark ink, so a themed
 * surface token would not reproduce it. The text above it is pinned dark for
 * the same reason — the mark does not invert in dark mode, so its ink must not
 * either.
 */
function LiveMark({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span
        aria-hidden="true"
        className="absolute inset-x-[-0.12em] inset-y-[0.14em] -z-10 bg-[#9fe5b1]"
      />
      <span className="relative text-[#050505] tabular-nums">{children}</span>
    </span>
  )
}

/** Arabic-Indic digits on /ar, Latin on /en — the rest of the app's habit. */
function formatCount(lang: string, n: number): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(n)
}

function deliveryLabel(
  d: NonNullable<LandingSectionProps["dictionary"]>["landing"],
  policy: LandingPolicy
): string | null {
  if (policy.windowActive) return d?.hero?.windowActive ?? null
  return policy.deliveryMode === "hybrid"
    ? (d?.hero?.modeHybrid ?? null)
    : policy.deliveryMode === "online"
      ? (d?.hero?.modeOnline ?? null)
      : null
}

/**
 * The homepage's small pill button, rather than a full-width one — a compact
 * action reads as a tool, a wide one reads as a landing page.
 */
function pill(variant: "default" | "ghost") {
  return cn(
    buttonVariants({ variant, size: "default" }),
    "h-10 gap-2 rounded-full px-5"
  )
}
