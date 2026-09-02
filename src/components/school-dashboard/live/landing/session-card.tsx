// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server component: pure prop composition, no client hooks or handlers.

import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import type {
  LandingSectionProps,
  LandingSession,
  LandingViewer,
} from "./types"
import { rowContext } from "./viewer"

/**
 * One class as a CARD — art above, copy below.
 *
 * The strip's `session-row.tsx` sets a class beside its picture; this sets it
 * under one, which is the shape a shelf of many wants. Both sections that use
 * cards draw this component: the catch-up shelf, which scrolls, and the
 * recordings grid under it. One card, two callers, for the reason the article
 * row has one implementation — the shelf and the strip had drifted within a
 * day of being written twice.
 *
 * The card answers, in order: which subject, which lesson of it, whose class
 * and when — and whether there is a recording, which is the difference between
 * catching up and merely reading what you missed.
 *
 * The lesson row is the one thing this card has that the strip's brief rows do
 * not, and it is here on purpose: a reader who missed the class is the reader
 * who most needs to know WHICH lesson it was. It is absent on any session
 * materialized from the timetable, so the row is dropped rather than rendered
 * empty (see `session-row.tsx` for why that is the normal case).
 *
 * Who it names follows the same role rule as the strip — the teacher unless
 * the reader IS the teacher of every row — so the two sections cannot end up
 * describing the same class differently.
 */
export function LandingSessionCard({
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
  const c = dictionary?.landing?.catchUp
  const context = rowContext(session, viewer)
  // A recording is only offered to a reader allowed to watch one — ACCOUNTANT
  // passes `read_school_dashboard` and sees every session, but `authorization.ts`
  // grants it no `view_recordings`, so the link would be refused on arrival.
  const watchable = session.hasRecording && viewer.canViewRecordings

  return (
    <Link
      href={
        watchable
          ? `/${lang}/live/${session.id}/recordings`
          : `/${lang}/live/${session.id}`
      }
      className="group block text-start"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl">
        <Art session={session} />
        {watchable ? (
          <>
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
            <span
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <Play className="size-9 fill-white text-white opacity-0 drop-shadow transition-opacity group-hover:opacity-100" />
            </span>
            <Badge
              variant="secondary"
              className="absolute start-2 bottom-2 gap-1 font-normal"
            >
              <Play className="size-3 fill-current" aria-hidden="true" />
              {c?.recording}
            </Badge>
          </>
        ) : null}
      </div>

      <div className="space-y-1 pt-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="group-hover:text-primary line-clamp-1 text-sm font-semibold transition-colors">
            {session.subjectName ?? session.title}
          </h3>
          {context ? (
            <Badge variant="secondary" className="shrink-0 font-normal">
              {context}
            </Badge>
          ) : null}
        </div>

        {session.lessonName ? (
          <p className="text-muted-foreground line-clamp-1 text-xs">
            {session.lessonName}
          </p>
        ) : null}

        <div className="text-muted-foreground flex min-w-0 items-center gap-x-1.5 text-xs">
          {viewer.showsTeacher && session.teacherName ? (
            <>
              <span className="text-foreground truncate font-medium">
                {session.teacherName}
              </span>
              <span aria-hidden="true" className="shrink-0 opacity-60">
                ·
              </span>
            </>
          ) : null}
          <span className="shrink-0 tabular-nums">
            {session.scheduledStart}
          </span>
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
function Art({ session }: { session: LandingSession }) {
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
      sizes="256px"
      unoptimized
    />
  )
}
