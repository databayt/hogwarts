// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition, no client hooks or handlers.

import Image from "next/image"
import Link from "next/link"
import { History } from "lucide-react"

import { cn } from "@/lib/utils"

import type {
  LandingSectionProps,
  LandingSession,
  LandingSubjectTile,
} from "./types"

interface PastShelfProps extends LandingSectionProps {
  sessions: LandingSession[]
  subjects: LandingSubjectTile[]
}

/**
 * Classes that already happened — the landing page's second shelf.
 *
 * The layout is thmanyah.com's shelf block, the one that follows the editorial
 * rows the strip above already mirrors, at its measured values rather than by
 * eye (`.clone/thmanyah-home`, the `الحلقات الجديدة` subtree):
 *
 *   shelf      : column · gap 34px
 *   header     : row · space-between · center · icon + 24px heading, gap 10px
 *                · a plain underlined "more" link on the far side
 *   body       : 24-col row · 16px gutter · row-gap 24px
 *                halves at sm, 14/10 at md, back to halves at lg
 *   list col   : column · gap 32px
 *   list row   : 16px gutter · radius 8px · block padding 8px · hover tint
 *   art        : basis 104px, 144px from md · square · radius 12px
 *   title      : 16px, 20px/32px from lg · 2 lines · margin-bottom 8px
 *   dek        : 14px · 1 line, 2 from lg · margin-bottom 8px
 *   meta       : row · wrap · column-gap 4px · row-gap 8px · 14px
 *   tile col   : 2 up, 3 up from lg · 16px gutter · square · radius 12px
 *
 * The same two departures the strip makes: COLOUR is ours, because this renders
 * inside a themed dashboard rather than the reference's light-only page, and
 * there are no author avatars because a session has a teacher's name and no
 * portrait.
 *
 * The tile column is the one real reinterpretation. The reference fills it with
 * the SHOWS its episodes came from; a school's equivalent is the subject, so
 * the tiles are the subjects that actually taught live, deduped out of the same
 * rows the list column reads. Each lands on that subject's most recent class,
 * which is the nearest thing to "the show's page" this block has.
 */
export function LivePastShelf({
  dictionary,
  lang,
  sessions,
  subjects,
}: PastShelfProps) {
  const p = dictionary?.landing?.past

  return (
    <section className="mb-16 flex w-full flex-col gap-y-[34px] border-b pb-16">
      <div className="flex w-full items-center justify-between gap-y-4">
        <div className="flex items-center gap-x-2.5">
          <History className="size-6 shrink-0" aria-hidden="true" />
          <h2 className="mb-0 text-[24px] font-semibold">{p?.title}</h2>
        </div>
        <Link
          href={`/${lang}/live/dashboard`}
          className="font-semibold underline underline-offset-2"
        >
          {p?.more}
        </Link>
      </div>

      {/* 14/10 at md is the reference's own split; it returns to halves at lg,
          where the tile column gains its third column and needs the width. */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 md:grid-cols-[14fr_10fr] lg:grid-cols-2">
        <ul className="flex flex-col gap-y-8">
          {sessions.map((session) => (
            <li key={session.id}>
              <PastRow session={session} dictionary={dictionary} lang={lang} />
            </li>
          ))}
        </ul>

        <ul className="grid grid-cols-2 gap-4 self-start lg:grid-cols-3">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <Link
                href={`/${lang}/live/${subject.sessionId}`}
                className="block overflow-hidden rounded-[12px] shadow-sm transition-transform hover:scale-[1.02]"
              >
                <div className="relative aspect-square w-full">
                  <Art
                    imageUrl={subject.imageUrl}
                    color={subject.color}
                    alt={subject.name}
                    sizes="(min-width: 1024px) 160px, 45vw"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * One past class as the reference's shelf row.
 *
 * Smaller art than the strip's lead row above (144px against 250px) and a
 * title that only reaches 20px at lg — the reference sizes its shelf rows down
 * exactly this way, so the shelf reads as the quieter half of the page.
 *
 * The row lands on the session page rather than the room: the room is closed,
 * and the session page is where a recording shows up if the school has one.
 */
function PastRow({
  session,
  dictionary,
  lang,
}: {
  session: LandingSession
  dictionary: LandingSectionProps["dictionary"]
  lang: string
}) {
  const p = dictionary?.landing?.past

  return (
    <Link
      href={`/${lang}/live/${session.id}`}
      className="group hover:bg-muted/50 -mx-2 flex items-start gap-y-4 rounded-[8px] py-2 transition-colors"
    >
      <div className="shrink-0 basis-[104px] px-2 md:basis-[144px]">
        <div className="relative aspect-square w-full overflow-hidden rounded-[12px]">
          <Art
            imageUrl={session.imageUrl}
            color={session.color}
            alt=""
            sizes="(min-width: 768px) 144px, 104px"
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 px-2 text-start">
        <h3 className="mb-2 line-clamp-2 text-base font-semibold lg:text-xl lg:leading-8">
          {session.title}
        </h3>

        <p className="mb-2 line-clamp-1 text-sm lg:line-clamp-2">
          {[session.subjectName, session.sectionName]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
          <span>{session.scheduledStart}</span>
          {session.teacherName ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-bold">{session.teacherName}</span>
            </>
          ) : null}
          <span className="sr-only">{p?.ended}</span>
        </div>
      </div>
    </Link>
  )
}

/**
 * Catalog artwork, with the subject's own colour as a first-class fallback —
 * `imageUrl` is null whenever the subject has no thumbnail OR CloudFront is
 * unconfigured, both normal states rather than failures. `unoptimized` because
 * these are already CDN-encoded at their render width.
 */
function Art({
  imageUrl,
  color,
  alt,
  sizes,
}: {
  imageUrl: string | null
  color: string | null
  alt: string
  sizes: string
}) {
  if (!imageUrl) {
    return (
      <div
        className={cn("h-full w-full")}
        style={{ backgroundColor: color || "#e5e7eb" }}
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
      />
    )
  }
  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      sizes={sizes}
      unoptimized
    />
  )
}
