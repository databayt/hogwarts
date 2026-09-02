// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Fragment, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Radio } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"
import { rowContext } from "./viewer"

/**
 * One session as the reference's article row, at two weights.
 *
 * Every value here is off its markup, not estimated: the row carries
 * `margin-inline: -8px` with a 16px row-gap and NO column gap — the space
 * between art and copy is the two columns' own padding (12px + 8px) — 4px of
 * padding all round below md, and from md `padding-block: 8px` with the start
 * side flush and 3px (lead) / 2px (small) on the end. The lead row is
 * middle-aligned and drops to top below md; the small rows are top-aligned at
 * every width.
 *
 * The art column is 104px basis on mobile — an 80px square once its 12px
 * padding is off — and 144px from md, giving 120. One size for both weights;
 * the reference's 274px lead column is deliberately not taken (see below). The
 * copy column is padded 8px and flexes.
 *
 * The two sizes:
 *
 *   lead   — the strip's featured card: the class that is running, or the next
 *            one to start. Every row it has, and the 20px title at lg.
 *   brief  — the strip's two under it. TWO text rows: the subject with its
 *            badge, then one meta line. It exists so the lead reads as the
 *            lead — the hierarchy is bought by simplifying its neighbours,
 *            not by decorating it.
 *
 * There used to be a third, `small`, which the past shelf drew. That shelf is
 * now the catch-up shelf and draws a card of its own, so the row is back to
 * the two weights the strip actually uses.
 *
 * The whole row is one link with a tinted hover, as theirs is.
 */
export function LandingSessionRow({
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
  size: "lead" | "brief"
}) {
  const href = joinHref(session, viewer, lang)
  const isLead = size === "lead"
  const isBrief = size === "brief"
  const context = rowContext(session, viewer)

  return (
    <Link
      href={href}
      className={cn(
        "group hover:bg-muted/50 -mx-2 flex flex-wrap gap-y-4 rounded-[8px] p-1 transition-colors md:py-2 md:ps-0",
        isLead
          ? "items-start md:items-center md:pe-[3px]"
          : "items-start md:pe-[2px]"
      )}
    >
      {/* ONE art size for every row, lead included. The reference gives its
          lead a 274px column, and taking that literally inverts the card: a
          250px square stands taller than the stacked text beside it, so the
          picture becomes the row. The lead is distinguished by what it SAYS
          — five rows against two — and by spanning the full width while its
          neighbours are halves. */}
      <div className="shrink-0 basis-[104px] px-3 md:basis-[144px]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[12px] md:max-w-[120px]">
          <Art session={session} sizes="120px" />
        </div>
      </div>

      <div className="min-w-0 flex-1 px-2 text-start">
        {/* The rows, in the order the card is read: WHAT subject, then where
            in it (chapter, then lesson), then who is teaching, then where the
            class is in its own clock.

            The title is the SUBJECT alone. It used to be `session.title`,
            which a materialized session builds as "subject · section" — the
            section then repeated on the row beneath it, and the heading grew
            to two lines on a phone for no information.

            Chapter and lesson are absent on any session materialized from the
            timetable: a slot knows its subject, not which lesson of it is
            being taught today. Rows that have nothing to say are DROPPED, not
            rendered empty — a card should never show a blank line where a
            teacher simply has not anchored a lesson. */}
        <div
          className={cn(
            "mt-0 flex flex-wrap items-baseline gap-x-2 gap-y-1",
            isBrief ? "mb-1.5" : "mb-2"
          )}
        >
          <h3
            className={cn(
              "line-clamp-2 text-base font-semibold",
              isLead && "lg:text-xl lg:leading-8"
            )}
          >
            {session.subjectName ?? session.title}
          </h3>
          {/* Where this class sits — the section for a reader who spans
              several, the grade for a student whose every row is their own
              section. `items-baseline` so the badge sits on the heading's
              baseline rather than centring against a two-line heading.

              It stays on the TITLE row at every size, brief included. Moving it
              down into the meta line was tried and is worse: an admin's line
              then carries a name, a section and a clock, and on a phone the
              first two truncate into ellipses at once. Up here it costs the
              heading no vertical space and leaves the meta line two items. */}
          {context ? (
            <Badge variant="secondary" className="shrink-0 font-normal">
              {context}
            </Badge>
          ) : null}
        </div>

        {isBrief ? (
          <BriefMeta
            session={session}
            dictionary={dictionary}
            viewer={viewer}
          />
        ) : (
          <>
            {session.chapterName ? (
              <p className="mb-1 line-clamp-1 text-sm">{session.chapterName}</p>
            ) : null}

            {session.lessonName ? (
              <p className="text-muted-foreground mb-2 line-clamp-1 text-sm">
                {session.lessonName}
              </p>
            ) : null}

            <div className="flex flex-col gap-y-1.5">
              {viewer.showsTeacher && session.teacherName ? (
                <span className="flex items-center gap-2 text-sm">
                  <Portrait
                    name={session.teacherName}
                    photoUrl={session.teacherPhotoUrl}
                  />
                  <span className="font-bold">{session.teacherName}</span>
                </span>
              ) : null}

              <Status session={session} dictionary={dictionary} />
            </div>
          </>
        )}
      </div>
    </Link>
  )
}

/**
 * The brief row's second and last line — who is teaching, and where the class
 * is in its own clock. WHERE it is taught is already on the title row, in the
 * badge, and repeating it here is what made this line truncate: an admin's row
 * carried a name, a section and a time, and on a phone the first two turned
 * into ellipses at once.
 *
 * Built as a LIST and then interleaved with separators, so a row with no
 * teacher never prints a dangling "·". A teacher's brief card is the clock
 * alone — their own name is the one thing on it that could tell them nothing,
 * since the page has already narrowed the strip to the classes they teach.
 *
 * NO portrait. The lead card sets the teacher beside a 24px round photo, the
 * way the reference does; on a two-row card that disc is 30px of a line that
 * still has a name and a time to fit, and it is the only thing on it carrying
 * no information.
 *
 * The clock is `shrink-0` and the name truncates, because a long teacher name
 * must never be what pushes the start time off the card.
 */
function BriefMeta({
  session,
  dictionary,
  viewer,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
  viewer: LandingViewer
}) {
  const items: Array<{ key: string; node: ReactNode }> = []

  if (viewer.showsTeacher && session.teacherName) {
    items.push({
      key: "who",
      node: (
        <span className="text-foreground truncate font-bold">
          {session.teacherName}
        </span>
      ),
    })
  }

  items.push({
    key: "when",
    node: <Status session={session} dictionary={dictionary} compact />,
  })

  return (
    <div className="text-muted-foreground flex min-w-0 items-center gap-x-1.5 text-xs sm:text-sm">
      {items.map(({ key, node }, index) => (
        <Fragment key={key}>
          {index > 0 ? (
            <span aria-hidden="true" className="shrink-0 opacity-60">
              ·
            </span>
          ) : null}
          {node}
        </Fragment>
      ))}
    </div>
  )
}

/**
 * The card's last row: where the class is in its own clock.
 *
 * A running class says so and counts its minutes; one about to end says THAT
 * instead, because "started" stops being the useful fact once there are eight
 * minutes left. A class close enough to starting says "soon" beside its time;
 * anything further out, and anything already over, prints the timestamp alone
 * — which for a past class is a date, formatted that way by the page.
 *
 * The phase is resolved on the server (see `resolvePhase` on the page), so
 * this component only chooses words for it.
 *
 * `compact` is the brief row's version: the same words, minus the minute
 * count. "34 من 45 دقيقة" is the featured card's detail — on a two-row card it
 * is the third thing on a line that already has to fit a name and a clock, and
 * it is the one of the three a reader can do without.
 */
function Status({
  session,
  dictionary,
  compact = false,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
  compact?: boolean
}) {
  const phase = dictionary?.landing?.now?.phase
  const running = session.phase === "started" || session.phase === "ending"

  // The number at the end of the row: how far a running class has got, or
  // when a class that has not started begins. A compact running row prints
  // neither — "بدأت" has already said the only thing it has room for.
  const number =
    running && session.progress && !compact
      ? (phase?.progress ?? "{done}/{total}")
          .replace("{done}", String(session.progress.done))
          .replace("{total}", String(session.progress.total))
      : running && compact
        ? null
        : session.scheduledStart || null

  return (
    <span
      className={cn(
        "flex items-center gap-x-2",
        compact
          ? "shrink-0"
          : "text-muted-foreground flex-wrap text-xs sm:text-sm"
      )}
    >
      {running ? (
        <span className="text-primary inline-flex items-center gap-1 font-bold">
          <Radio className="size-3.5" aria-hidden="true" />
          {session.phase === "ending" ? phase?.ending : phase?.started}
        </span>
      ) : null}

      {session.phase === "soon" ? (
        <span className="font-bold">{phase?.soon}</span>
      ) : null}

      {number ? <span className="tabular-nums">{number}</span> : null}
    </span>
  )
}

/**
 * The byline's 24px round portrait.
 *
 * `Teacher.profilePhotoUrl` is the source, and it is USUALLY NULL — one demo
 * teacher in a hundred has one, and a school that never uploads staff photos
 * has none at all. So initials are the ordinary path, not an error state: two
 * letters on a muted disc, at the same diameter, so the byline's baseline does
 * not shift when a photo does exist.
 *
 * Deliberately NOT the shadcn `Avatar`, which is Radix and so a client
 * component — this row is pure server composition, and a decorative 24px disc
 * is not worth putting the block's first hydration boundary on the page for.
 */
function Portrait({
  name,
  photoUrl,
}: {
  name: string
  photoUrl: string | null
}) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt=""
        width={24}
        height={24}
        className="size-6 shrink-0 rounded-full object-cover"
        unoptimized
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
    >
      {initials(name)}
    </span>
  )
}

/** First letters of the first two words — the usual two-letter monogram. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => [...word][0] ?? "")
    .join("")
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
      className="object-cover"
      sizes={sizes}
      unoptimized
    />
  )
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
