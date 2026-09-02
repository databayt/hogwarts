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
      <div
        className={cn(
          "shrink-0 basis-[104px] px-3",
          isLead ? "md:basis-[274px]" : "md:basis-[144px]"
        )}
      >
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-[12px]",
            isLead ? "md:max-w-[250px]" : "md:max-w-[120px]"
          )}
        >
          <Art
            session={session}
            sizes={isLead ? "(min-width: 768px) 250px, 80px" : "120px"}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 px-2 text-start">
        <h3 className="mt-0 mb-2 line-clamp-2 text-base font-semibold lg:text-xl lg:leading-8">
          {session.title}
        </h3>

        <p className="mb-2 line-clamp-1 text-sm lg:line-clamp-2">
          {dek(session)}
        </p>

        {/* Their byline row: the person in bold, then the placing and the date
            in the secondary colour, the date a size smaller until sm. Ours
            names the teacher, then where the class sits and when — or that it
            is running, which is this page's version of a dateline. */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-1",
            isLead ? "gap-y-3" : "gap-y-2"
          )}
        >
          {session.teacherName ? (
            <span className="text-sm font-bold">{session.teacherName}</span>
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
