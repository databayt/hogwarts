// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { Radio } from "lucide-react"

import { cn } from "@/lib/utils"

import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"

/**
 * One session as the reference's article row.
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
 * padding is off — and 274px (lead) / 144px (small) from md, giving 250 and
 * 120. The copy column is padded 8px and flexes.
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
  size: "lead" | "small"
}) {
  const n = dictionary?.landing?.now
  const href = joinHref(session, viewer, lang)
  const isLead = size === "lead"

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
      <div className="shrink-0 basis-[104px] px-3 md:basis-[144px]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[12px] md:max-w-[120px]">
          <Art session={session} sizes="120px" />
        </div>
      </div>

      <div className="min-w-0 flex-1 px-2 text-start">
        {/* Five rows, in the order the card is read: WHAT subject, then where
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
        <h3 className="mt-0 mb-2 line-clamp-2 text-base font-semibold lg:text-xl lg:leading-8">
          {session.subjectName ?? session.title}
        </h3>

        {session.chapterName ? (
          <p className="mb-1 line-clamp-1 text-sm">{session.chapterName}</p>
        ) : null}

        {session.lessonName ? (
          <p className="text-muted-foreground mb-2 line-clamp-1 text-sm">
            {session.lessonName}
          </p>
        ) : null}

        <div className={cn("flex flex-col", isLead ? "gap-y-1.5" : "gap-y-1")}>
          {session.teacherName ? (
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
      </div>
    </Link>
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
 */
function Status({
  session,
  dictionary,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
}) {
  const phase = dictionary?.landing?.now?.phase
  const running = session.phase === "started" || session.phase === "ending"

  return (
    <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs sm:text-sm">
      {running ? (
        <span className="text-primary inline-flex items-center gap-1 font-bold">
          <Radio className="size-3.5" aria-hidden="true" />
          {session.phase === "ending" ? phase?.ending : phase?.started}
        </span>
      ) : null}

      {session.phase === "soon" ? (
        <span className="font-bold">{phase?.soon}</span>
      ) : null}

      {running && session.progress ? (
        <span className="tabular-nums">
          {(phase?.progress ?? "{done}/{total}")
            .replace("{done}", String(session.progress.done))
            .replace("{total}", String(session.progress.total))}
        </span>
      ) : session.scheduledStart ? (
        <span className="tabular-nums">{session.scheduledStart}</span>
      ) : null}
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
      className="object-cover transition-transform duration-300 group-hover:scale-105"
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
