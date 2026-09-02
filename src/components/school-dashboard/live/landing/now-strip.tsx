// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { CalendarClock, Radio } from "lucide-react"

import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
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
 * The layout is thmanyah.com's editorial block, mirrored from a capture of the
 * section directly under its own banner (`.clone/thmanyah-editorial`), at its
 * measured values rather than by eye:
 *
 *   card row   : flex · gap 16px · align center (start below md) · radius 8px
 *                · block padding 8px · inline margin −8px · hover tint
 *   lead art   : column basis 274px, inline padding 12px → 250×250 · radius 12px
 *   small art  : column basis 144px, inline padding 12px → 120×120 · radius 12px
 *   copy col   : flex 1 · inline padding 8px
 *   title      : 20px / 32px · 600 · margin-bottom 8px
 *   dek        : 14px / 20px · margin-bottom 8px · 2 lines on the small card
 *   meta row   : flex · height 24px · column-gap 4px · row-gap 12px · 14/20
 *   two-up     : halves at 50%, inline padding 37.5px — i.e. a 75px gutter
 *                with the content flush to the lead card's own edges
 *
 * Two deliberate departures. COLOUR is ours: the reference is a light-only
 * page with a brand orange for its bylines, while this renders inside a themed
 * dashboard, so the values map to `foreground` / `muted-foreground` and the
 * accent is the live state. And there is no author AVATAR — a session has a
 * teacher's name but no portrait, and the reference's 24px round image beside
 * the byline has nothing to hold.
 *
 * The shape suits this data better than the even four-column grid it replaced:
 * a school usually has ONE class live and several coming up, and a uniform
 * grid rendered that single live session as one lonely card in four columns of
 * white space.
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
    // The reference closes the block with a hairline before the next one.
    <section className="mb-16 space-y-10 border-b pb-16">
      {featured ? (
        <div>
          <SectionHeading
            title={n?.liveTitle}
            lang={lang}
            viewAll={n?.viewAll}
          />
          <SessionRow
            session={featured}
            dictionary={dictionary}
            lang={lang}
            viewer={viewer}
            size="lead"
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
          {/* The reference pads each half by 37.5px inside a row pulled out by
              the same amount; an explicit 75px gutter is the same geometry
              without the negative margin. */}
          <ul className="grid grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-[75px]">
            {rest.slice(0, 4).map((session) => (
              <li key={session.id}>
                <SessionRow
                  session={session}
                  dictionary={dictionary}
                  lang={lang}
                  viewer={viewer}
                  size="small"
                />
              </li>
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
 * One session as the reference's article row — artwork beside copy, the whole
 * row a single link with a tinted hover.
 *
 * `lead` and `small` differ ONLY in the art column (274/250 vs 144/120) and in
 * how far the dek is allowed to run, exactly as the two sizes do there. The
 * reference has no button inside a card and neither does this: the row itself
 * is the action, and for a live class it lands in the room.
 */
function SessionRow({
  session,
  dictionary,
  lang,
  viewer,
  size,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
  lang: string
  viewer: LandingViewer
  size: "lead" | "small"
}) {
  const n = dictionary?.landing?.now
  const href = joinHref(session, viewer, lang)
  const isLead = size === "lead"

  return (
    <Link
      href={href}
      className="group hover:bg-muted/50 -mx-2 flex flex-wrap items-start gap-4 rounded-[8px] py-2 transition-colors md:items-center"
    >
      <div
        className={cn(
          "shrink-0 px-3",
          isLead ? "md:basis-[274px]" : "md:basis-[144px]"
        )}
      >
        <div
          className={cn(
            "relative size-20 overflow-hidden rounded-[12px]",
            isLead ? "md:size-[250px]" : "md:size-[120px]"
          )}
        >
          <Art
            session={session}
            sizes={isLead ? "(min-width: 768px) 250px, 80px" : "120px"}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 px-2 text-start">
        <h3 className="mb-2 line-clamp-2 text-[20px] leading-[32px] font-semibold">
          {session.title}
        </h3>

        <p
          className={cn(
            "mb-2 text-[14px] leading-[20px]",
            isLead ? "line-clamp-1" : "line-clamp-2"
          )}
        >
          {meta(session)}
        </p>

        <div className="text-muted-foreground flex min-h-6 flex-wrap items-center gap-x-1 gap-y-3 text-[14px] leading-[20px]">
          {session.isLive ? (
            <span className="text-primary inline-flex items-center gap-1 font-bold">
              <Radio className="size-3.5" aria-hidden="true" />
              {n?.liveTitle}
            </span>
          ) : (
            <span className="tabular-nums">{session.scheduledStart}</span>
          )}
          {session.teacherName ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-bold">{session.teacherName}</span>
            </>
          ) : null}
        </div>
      </div>
    </Link>
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

/** The dek line: what the class IS, without repeating the title's words. */
function meta(session: LandingSession): string {
  return [session.subjectName, session.sectionName].filter(Boolean).join(" · ")
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
