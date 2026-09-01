// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { CalendarClock, Radio } from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"

interface NowStripProps extends LandingSectionProps {
  live: LandingSession[]
  upcoming: LandingSession[]
  viewer: LandingViewer
}

/**
 * What is actually happening — the first content on the page.
 *
 * It used to sit third, under four marketing cards and above two more bands,
 * on a page teachers and students open every school day. It is now the thing
 * you land on.
 *
 * The shape follows thmanyah.com's editorial block: one FEATURED item with
 * large square artwork beside its copy, then the rest as a compact row of
 * small-artwork rows beneath. That suits this data far better than the even
 * four-column grid it replaces — a school usually has one class live and
 * several coming up, and a uniform grid rendered the single live session as
 * one lonely card in four columns of white space.
 *
 * Live and upcoming stay SEPARATE: one heading over a list holding both would
 * misdescribe half of them.
 *
 * Times arrive pre-formatted in the school's own zone (see the page) — a
 * server-side `toLocaleTimeString` resolves against the runtime's zone, which
 * is UTC on Vercel.
 */
export function LiveNowStrip({
  dictionary,
  lang,
  live,
  upcoming,
  viewer,
}: NowStripProps) {
  const n = dictionary?.landing?.now
  const featured = live[0] ?? null
  // Anything live beyond the first joins the compact row, ahead of what is
  // merely scheduled — a room you can walk into now outranks one you cannot.
  const rest = [...live.slice(1), ...upcoming]

  if (!featured && rest.length === 0) {
    return (
      <section className="mb-16">
        <div className="flex flex-col items-center gap-3 rounded-[36px] border border-dashed py-16 text-center">
          <CalendarClock
            className="text-muted-foreground size-8"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="font-medium">{n?.emptyTitle}</p>
          <p className={cn(typographyVariants.hint, "max-w-[42ch]")}>
            {n?.emptyDescription}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-16 space-y-10">
      {featured ? (
        <div>
          <SectionHeading
            title={n?.liveTitle}
            lang={lang}
            viewAll={n?.viewAll}
          />
          <FeaturedSession
            session={featured}
            dictionary={dictionary}
            lang={lang}
            viewer={viewer}
          />
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div>
          <SectionHeading
            title={featured ? n?.upcomingTitle : n?.liveTitle}
            lang={lang}
            viewAll={featured ? undefined : n?.viewAll}
          />
          <ul className="grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
            {rest.slice(0, 4).map((session) => (
              <CompactSession
                key={session.id}
                session={session}
                dictionary={dictionary}
                lang={lang}
                viewer={viewer}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

function SectionHeading({
  title,
  lang,
  viewAll,
}: {
  title?: string
  lang: string
  viewAll?: string
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className={typographyVariants.cardTitle}>{title}</h2>
      {viewAll ? (
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "rounded-full"
          )}
          href={`/${lang}/live/dashboard`}
        >
          {viewAll}
        </Link>
      ) : null}
    </div>
  )
}

/**
 * The one session worth acting on: square artwork beside the copy, at the
 * banner's 12px-radius scale, with the join action inline rather than as a
 * caption. Square rather than 16:9 because the catalog thumbnails are already
 * square-ish and it holds the row height honest next to the text column.
 */
function FeaturedSession({
  session,
  dictionary,
  lang,
  viewer,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
  lang: string
  viewer: LandingViewer
}) {
  const n = dictionary?.landing?.now
  const href = joinHref(session, viewer, lang)

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
      <Link
        href={href}
        className="group relative block size-[250px] shrink-0 overflow-hidden rounded-xl"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Art session={session} sizes="250px" />
      </Link>

      <div className="min-w-0 flex-1 text-start">
        <Badge className="mb-3 gap-1 rounded-full">
          <Radio className="size-3" aria-hidden="true" />
          {n?.liveTitle}
        </Badge>

        <h3 className="text-lg leading-snug font-semibold text-balance sm:text-xl">
          <Link href={href} className="hover:text-primary transition-colors">
            {session.title}
          </Link>
        </h3>

        <p className={cn(typographyVariants.hint, "mt-2")}>{meta(session)}</p>

        <Link
          className={cn(
            buttonVariants({ size: "sm" }),
            "mt-5 gap-2 rounded-full"
          )}
          href={href}
        >
          {ctaLabel(session, dictionary, viewer)}
        </Link>
      </div>
    </div>
  )
}

/** A scheduled session: small square artwork, title, time. */
function CompactSession({
  session,
  dictionary,
  lang,
  viewer,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
  lang: string
  viewer: LandingViewer
}) {
  const n = dictionary?.landing?.now
  const href = joinHref(session, viewer, lang)

  return (
    <li>
      <Link href={href} className="group flex items-center gap-4 text-start">
        <div className="relative size-[120px] shrink-0 overflow-hidden rounded-xl">
          <Art session={session} sizes="120px" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="group-hover:text-primary line-clamp-2 leading-snug font-semibold transition-colors">
            {session.title}
          </h3>
          <p className={cn(typographyVariants.hint, "mt-1.5")}>
            {meta(session)}
          </p>
          <p className="mt-1.5 text-xs font-medium tabular-nums">
            {session.isLive ? (
              <span className="text-primary inline-flex items-center gap-1">
                <Radio className="size-3" aria-hidden="true" />
                {n?.liveTitle}
              </span>
            ) : (
              session.scheduledStart
            )}
          </p>
        </div>
      </Link>
    </li>
  )
}

/**
 * The subject's own catalog artwork.
 *
 * `imageUrl` is null whenever the subject has no thumbnail OR CloudFront is
 * unconfigured, which is a normal state rather than an error — so the coloured
 * ground is a first-class fallback, not a placeholder for a failure.
 * `unoptimized` because these are already CDN-encoded at their render width.
 */
function Art({ session, sizes }: { session: LandingSession; sizes: string }) {
  if (!session.imageUrl) {
    return (
      <div
        className="h-full w-full"
        style={{ backgroundColor: session.color || "#e5e7eb" }}
      />
    )
  }
  return (
    <Image
      src={session.imageUrl}
      alt=""
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      sizes={sizes}
      unoptimized
    />
  )
}

function meta(session: LandingSession): string {
  return [session.subjectName, session.sectionName, session.teacherName]
    .filter(Boolean)
    .join(" · ")
}

/**
 * Live goes straight into the room; scheduled opens the session. A viewer who
 * may not join at all (ACCOUNTANT) only ever gets the session page.
 */
function joinHref(
  session: LandingSession,
  viewer: LandingViewer,
  lang: string
): string {
  return session.isLive && viewer.canJoin
    ? `/${lang}/live/${session.id}/room`
    : `/${lang}/live/${session.id}`
}

function ctaLabel(
  session: LandingSession,
  dictionary: LandingSectionProps["dictionary"],
  viewer: LandingViewer
): string | undefined {
  const n = dictionary?.landing?.now
  const a = dictionary?.landing?.actions
  if (!viewer.canJoin) return n?.open
  if (!session.isLive) return n?.open
  if (viewer.isHost) return a?.start
  return viewer.role === "GUARDIAN" ? a?.observe : n?.joinNow
}
