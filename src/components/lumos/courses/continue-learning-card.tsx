// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server-composable: no hooks, no handlers, so it costs the page no hydration.
import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import type { LessonInstructor } from "@/components/lumos/data/catalog/get-continue-watching"

export interface LeadCardItem {
  /** Where the card goes — a lesson, always. */
  href: string
  courseTitle: string
  grade: number | null
  chapterTitle: string | null
  lessonTitle: string | null
  thumbnailUrl: string | null
  color: string | null
  instructor: LessonInstructor | null
  /** The bolded word on the last row: "Resume" / "Start". */
  statusLabel: string
  /** What follows it — a clock, a lesson count. Omitted when there is none. */
  statusDetail: string | null
}

interface Props {
  item: LeadCardItem
  /** The card's kicker: the section's own name, drawn inside the card. */
  title: string
  dictionary?: Record<string, any>
}

/**
 * The catalog's lead card, as the /live landing's featured article row.
 *
 * It has TWO states and is never absent. Where the learner left off, when they
 * have started something; otherwise the opening lesson of the course the page
 * recommends first, so a first-time learner gets a way IN rather than a page
 * that opens on a shelf. Both states are the same five rows and both link to a
 * lesson — only the kicker and the last row's words differ — which is why the
 * component takes a flat `LeadCardItem` instead of one fetcher's row type.
 *
 * ONE card, not a strip. The row it replaced was a scroller of small
 * thumbnails, which made the page open on a set of near-identical tiles; the
 * lead card says the same thing in the shape the live page already uses for
 * "the class that matters right now", and the courses below it are the page's
 * breadth. A learner with several lessons on the go gets their MOST RECENT one
 * — `getContinueWatching` orders by `updatedAt`, so index 0 is that lesson, and
 * the rest stay reachable from the course pages.
 *
 * The geometry is `live/landing/session-row.tsx` at its `lead` weight, down to
 * the negative margin and the two columns' own padding standing in for a column
 * gap. The rows are that card's, in its order: the section's own name, then
 * WHAT subject, then where in it (chapter, then lesson), then who teaches it,
 * then where the learner is in its clock.
 *
 * The byline names whoever the lesson would actually play for this school —
 * `getContinueWatching` resolves it through the same `applyInstructorPolicy`
 * the lesson page uses, so the card and the player cannot disagree about who
 * is teaching. A lesson with no reachable video has no instructor, and that
 * row is dropped rather than rendered empty, which is the live card's own rule.
 */
export function ContinueLearningCard({ item, title, dictionary }: Props) {
  const gradeTemplate = dictionary?.search?.gradeLabel as string | undefined

  const gradeLabel =
    item.grade != null
      ? (gradeTemplate?.replace("{n}", String(item.grade)) ??
        `Grade ${item.grade}`)
      : null

  return (
    <section>
      <Link
        href={item.href}
        className="group hover:bg-muted/50 -mx-2 flex flex-wrap items-start gap-y-4 rounded-[8px] p-1 transition-colors md:items-center md:py-2 md:ps-0 md:pe-[3px]"
      >
        <div className="shrink-0 basis-[104px] px-3 md:basis-[144px]">
          <div className="relative aspect-square w-full overflow-hidden rounded-[12px] md:max-w-[120px]">
            <Art item={item} />
          </div>
        </div>

        <div className="min-w-0 flex-1 px-2 text-start">
          {/* The section's name, as the card's first text row rather than a
              heading above it. There is exactly ONE card here, so a heading
              floating over it was a label for a list of one — inside, it reads
              as the card's own kicker and buys the row back. */}
          <p className="text-muted-foreground mb-1 text-xs font-medium">
            {title}
          </p>

          <div className="mt-0 mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="line-clamp-2 text-base font-semibold lg:text-xl lg:leading-8">
              {item.courseTitle}
            </h3>
            {gradeLabel ? (
              <Badge variant="secondary" className="shrink-0 font-normal">
                {gradeLabel}
              </Badge>
            ) : null}
          </div>

          {item.chapterTitle ? (
            <p className="mb-1 line-clamp-1 text-sm">{item.chapterTitle}</p>
          ) : null}

          {item.lessonTitle ? (
            <p className="text-muted-foreground mb-2 line-clamp-1 text-sm">
              {item.lessonTitle}
            </p>
          ) : null}

          {/* Byline over clock, the live lead card's last two rows. A lesson
              whose video the school cannot reach has no instructor, and that
              row is dropped rather than rendered empty. */}
          <div className="flex flex-col gap-y-1.5">
            {item.instructor?.name ? (
              <span className="flex items-center gap-2 text-sm">
                <Portrait
                  name={item.instructor.name}
                  photoUrl={item.instructor.image}
                />
                <span className="font-bold">{item.instructor.name}</span>
              </span>
            ) : null}

            <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs sm:text-sm">
              <span className="text-primary font-bold">{item.statusLabel}</span>
              {item.statusDetail ? (
                <span className="tabular-nums">{item.statusDetail}</span>
              ) : null}
            </span>
          </div>
        </div>
      </Link>
    </section>
  )
}

/**
 * The lesson's own artwork, falling back to the colour the catalog carries for
 * it. A null thumbnail is ordinary here rather than an error — most catalog
 * lessons have none — so the coloured ground is a first-class state.
 */
function Art({ item }: { item: LeadCardItem }) {
  if (!item.thumbnailUrl) {
    return (
      <div
        className="h-full w-full"
        style={{ backgroundColor: item.color || "#e5e7eb" }}
      />
    )
  }
  return (
    <Image
      src={item.thumbnailUrl}
      alt=""
      fill
      className="object-cover"
      sizes="120px"
      unoptimized
    />
  )
}

/**
 * The byline's 24px round portrait — the live card's, and for the same reason:
 * an instructor photo is USUALLY NULL, so two letters on a muted disc is the
 * ordinary path rather than an error state, at the same diameter so the
 * byline's baseline does not shift when a photo does exist.
 *
 * Deliberately not the shadcn `Avatar`, which is Radix and so a client
 * component. This card is pure server composition and a decorative disc is not
 * worth a hydration boundary.
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
