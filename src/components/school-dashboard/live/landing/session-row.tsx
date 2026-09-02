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
        <h3 className="mt-0 mb-2 line-clamp-2 text-base font-semibold lg:text-xl lg:leading-8">
          {session.title}
        </h3>

        <p className="mb-2 line-clamp-1 text-sm lg:line-clamp-2">
          {dek(session)}
        </p>

        {/* Their byline is TWO stacked rows, not one: the author beside a 24px
            round portrait, then the placing and the date in the secondary
            colour a size smaller until sm. Ours names the teacher, then when
            the class runs — or that it is running now, which is this page's
            version of a dateline. Stacking them is also what makes the copy
            column the taller of the two, as it is in the reference. */}
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

          <span className="text-muted-foreground text-xs sm:text-sm">
            {session.isLive ? (
              <span className="text-primary inline-flex items-center gap-1 font-bold">
                <Radio className="size-3.5" aria-hidden="true" />
                {n?.liveTitle}
              </span>
            ) : (
              <span className="tabular-nums">{session.scheduledStart}</span>
            )}
          </span>
        </div>
      </div>
    </Link>
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

/** The dek line: what the class IS, without repeating the title's words. */
function dek(session: LandingSession): string {
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
