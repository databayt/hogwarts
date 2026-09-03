"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, ChevronLeft, Loader2, Play, Plus, Share } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  TitleCard,
  titleCardChip,
  titleCardChipSolid,
  titleCardMoreChip,
  titleCardPill,
  titleCardTopGlyph,
  titleCardTopPill,
} from "@/components/lumos/shared/title-card"

import { downloadClassIcs } from "./calendar-file"

/**
 * What the card says. Resolved on the SERVER — the times are formatted in the
 * school's own zone and the names go through the translation cache, neither of
 * which a client component can do.
 */
export interface RoomTitleCardData {
  /** The heading: the SUBJECT alone. `Conference.title` is built as
   *  "subject · section", so using it would repeat the section that the meta
   *  line below already carries, and wrap to two lines on a phone. Same
   *  decision the landing card records. */
  subject: string
  /** The badge. Off `Section.grade`, never parsed out of `Section.name` —
   *  that name is "Grade 7-A", the section including its letter. */
  grade: string | null
  section: string | null
  teacher: string | null
  /** Only a teacher who anchored a catalog lesson through the wizard has
   *  these. Most sessions do not, and the rows are dropped rather than
   *  rendered empty. */
  chapter: string | null
  lesson: string | null
  /** Already in the school's timezone. */
  startTime: string | null
  durationLabel: string | null
  isLive: boolean
  isRecording: boolean
  /** The class's own clock, as epoch milliseconds. Numbers rather than
   *  formatted strings because the pill's progress has to keep MOVING — see
   *  `useClassProgress`. The printed start time above stays server-formatted,
   *  since that one is a wall-clock label and needs the school's zone. */
  startsAtMs: number | null
  endsAtMs: number | null
  /** The class's own sentence, when it has one. Most do not — the wizard's
   *  description is optional and a materialized slot writes none. */
  description: string | null
  resourceCount: number
  thumbnailUrl: string | null
  color: string | null
}

export interface RoomTitleCardLabels {
  join: string
  joining: string
  more: string
  live: string
  scheduled: string
  recorded: string
  resourceOne: string
  resourceMany: string
  free: string
  /** Carries `{n}`. The reference's `10m left`. */
  remaining: string
  /** Carries `{h}` and `{m}`. The reference's `1h 5m left`. */
  remainingHours: string
  back: string
  /** The reference's `ADD`, on the button itself. */
  add: string
  /** What the button does, for the tooltip and the screen reader — "ADD"
   *  alone says nothing about WHAT is being added. */
  addToCalendar: string
  share: string
  /** Confirmation for the clipboard path, where nothing else happens on
   *  screen to say the share worked. */
  linkCopied: string
}

/**
 * The reference's `formatRemaining`, minute for minute: an hour or more prints
 * `1h 5m left`, anything less prints `30m left`, and ZERO prints `0m left`
 * rather than a phrase.
 *
 * The zero case is the whole point of mirroring this rather than writing
 * something kinder. A sentence there — "ending now" — is a different KIND of
 * label from the figure beside every other value, so the chip changed shape in
 * the last minute of a class. The reference never does that, and the figure
 * running down to zero is what makes the number readable as a countdown.
 *
 * Translatable, unlike the reference's, which hardcodes its English and prints
 * "10m left" on an Arabic hero.
 */
function formatRemaining(
  minutes: number,
  labels: Pick<RoomTitleCardLabels, "remaining" | "remainingHours">
): string {
  if (minutes >= 60) {
    return labels.remainingHours
      .replace("{h}", String(Math.floor(minutes / 60)))
      .replace("{m}", String(minutes % 60))
  }
  return labels.remaining.replace("{n}", String(minutes))
}

interface RoomTitleCardProps {
  data: RoomTitleCardData
  labels: RoomTitleCardLabels
  /** The calendar event's UID, so adding the same class twice UPDATES the
   *  reader's entry instead of duplicating it. */
  sessionId: string
  detailHref: string
  pending: boolean
  error: string | null
  onJoin: () => void
}

/**
 * One mark in the row under the meta line — the lesson hero's `4K` / `Free` /
 * `CC` / `AD` boxes, same two weights: one filled, the rest outlined.
 *
 * These are the lesson's marks verbatim, on a class. A live room has no 4K
 * stream (the host publishes 720p), no captions and no audio description, so
 * three of the four are not yet true of what they sit on — this is the shared
 * shape landing first, with the class's own marks to follow.
 */
function Mark({ label, solid }: { label: string; solid?: boolean }) {
  return (
    <span className={solid ? titleCardChipSolid : titleCardChip}>{label}</span>
  )
}

/**
 * How far into the class we are, ticking.
 *
 * The landing page's cards deliberately resolve their phase on the SERVER and
 * accept going stale, because putting a clock on them would cost that block
 * its first hydration boundary. This card is already a client component — it
 * has a Join button — so the tick is free here, and a progress bar that froze
 * the moment the page rendered would be worse than none at all.
 *
 * Elapsed and remaining are durations between two absolute instants, so the
 * device's clock being a few minutes off shifts both by the same amount and
 * changes nothing a reader would notice. The printed START time is not
 * computed here for exactly the opposite reason: that one IS a wall-clock
 * label, and it is formatted on the server in the school's zone.
 */
function useClassProgress(startsAtMs: number | null, endsAtMs: number | null) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (startsAtMs === null || endsAtMs === null) return
    // Not in the initial render: the server has no clock the client agrees
    // with, and reading one during render would hydrate to different markup.
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [startsAtMs, endsAtMs])

  if (startsAtMs === null || endsAtMs === null || now === null) return null
  if (now < startsAtMs) return null

  const span = endsAtMs - startsAtMs
  if (span <= 0) return null

  return {
    percent: Math.min(100, Math.max(0, ((now - startsAtMs) / span) * 100)),
    // Ceil, like the reference: a class with 30 seconds left reads "1m left",
    // never "0m left" while it is still running.
    minutesLeft: Math.max(0, Math.ceil((endsAtMs - now) / 60_000)),
  }
}

/**
 * The card a class opens on: its artwork, who teaches it, when it runs, and
 * one white pill that walks you in.
 *
 * It exists because the room used to connect the moment the URL resolved. A
 * student got a spinner and then, abruptly, thirty faces; a teacher got the
 * same, having already started the class by doing nothing but opening a tab.
 * Joining is now something you DO, and the card is where you decide to.
 *
 * The frame is the lumos lesson hero's, imported rather than copied — see
 * `lumos/shared/title-card`.
 */
export function RoomTitleCard({
  data,
  labels,
  sessionId,
  detailHref,
  pending,
  error,
  onJoin,
}: RoomTitleCardProps) {
  // The meta line, minus whatever this session has nothing to say about.
  // The reference's meta line carries genre, date and runtime — the facts you
  // read BEFORE deciding, set as one dot-separated sentence. Ours carries where
  // the class is, what it covers, when it starts and how long it runs. The
  // marks row below the button is left holding only boxes, as it is there.
  // THREE items, like the frame's "Documentary · Jun 27, 2021 · 30 min TV+".
  // Where the class is, when it starts, how long it runs. Six items wrapped
  // this line onto two, and the frame's is one.
  //
  // `Section.name` is already "Grade 10 - A", so the grade would repeat it;
  // the teacher, the chapter and the lesson move into the paragraph, which is
  // where the frame puts its narrator too.
  const metaParts = [data.section, data.startTime, data.durationLabel].filter(
    (part): part is string => Boolean(part)
  )
  const progress = useClassProgress(data.startsAtMs, data.endsAtMs)
  // A class with no clock cannot become a calendar event, so the button that
  // would make one is not offered.
  const canAdd = data.startsAtMs !== null && data.endsAtMs !== null
  const [added, setAdded] = useState(false)
  const [shared, setShared] = useState(false)

  const onAdd = () => {
    if (data.startsAtMs === null || data.endsAtMs === null) return
    downloadClassIcs(
      {
        id: sessionId,
        title: data.subject,
        description: data.description,
        url: `${window.location.origin}${detailHref}`,
        startsAtMs: data.startsAtMs,
        endsAtMs: data.endsAtMs,
      },
      `${data.subject}.ics`
    )
    setAdded(true)
  }

  const onShare = async () => {
    const url = `${window.location.origin}${detailHref}`
    // The platform sheet where there is one — a phone, where sharing a class
    // with a classmate is the actual gesture. Everywhere else the clipboard
    // is the whole of what a browser can do.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: data.subject, url })
        return
      } catch {
        // Dismissing the sheet rejects. Fall through to the clipboard rather
        // than treating a deliberate cancel as a failure worth reporting.
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShared(true)
    } catch {
      // No clipboard permission and no share sheet: nothing left to try, and
      // the URL is in the address bar anyway.
    }
  }

  return (
    <TitleCard
      // FOUR FIFTHS of the viewport, not all of it. The reference's poster
      // block is 646px of an 844px frame — it deliberately stops short so the
      // shelf under it shows, which is what tells you the page continues.
      // This card was locked to the screen and read as the whole page.
      //
      // A FRACTION rather than a subtracted constant, which is what this was
      // first: `calc(100dvh - 7rem)` gives up the same 112px on every display,
      // so the shelf peeks by a smaller and smaller share as the screen grows
      // and by a bigger one as it shrinks. 80% keeps the proportion the
      // reference has at every height. The phone is left alone — there the
      // frame is already a 4:5 poster with the stack flowing after it.
      className="sm:min-h-[80dvh]"
      topEnd={
        <>
          {canAdd && (
            <button
              type="button"
              onClick={onAdd}
              className={titleCardTopPill}
              title={labels.addToCalendar}
              aria-label={labels.addToCalendar}
            >
              {added ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Plus className="size-4" aria-hidden />
              )}
              {labels.add}
            </button>
          )}
          <button
            type="button"
            onClick={() => void onShare()}
            className={cn(titleCardTopGlyph, "size-9 justify-center")}
            title={shared ? labels.linkCopied : labels.share}
            aria-label={labels.share}
          >
            {shared ? (
              <Check className="size-5" aria-hidden />
            ) : (
              <Share className="size-5" aria-hidden />
            )}
          </button>
        </>
      }
      topStart={
        <Link
          href={detailHref}
          className={cn(titleCardTopGlyph, "text-base font-medium")}
        >
          {/* The chevron is one of the few glyphs that MUST mirror: it points
              the way back through the reading order, not through time. */}
          <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
          {labels.back}
        </Link>
      }
      // The card runs the full width of the page it opens, not a column.
      sizes="100vw"
      thumbnailUrl={data.thumbnailUrl}
      color={data.color}
      alt={data.subject}
      title={data.subject}
      description={data.description ?? undefined}
      meta={
        metaParts.length > 0 ? (
          <>
            <span>{metaParts.join(" · ")}</span>
            <Link href={detailHref} className={titleCardMoreChip}>
              {labels.more}
            </Link>
          </>
        ) : undefined
      }
      chips={
        <>
          {/* Whether the room is open. Outlined, because the reference spends
              its one filled mark on `4K` and this row mirrors it. */}
          <Mark label={data.isLive ? labels.live : labels.scheduled} />
          <Mark label="4K" solid />
          <Mark label={labels.free} />
          <Mark label="CC" />
          <Mark label="AD" />
          {data.isRecording && <Mark label={labels.recorded} />}
          {data.resourceCount > 0 && (
            <>
              <span>&middot;</span>
              <span>
                {data.resourceCount}{" "}
                {data.resourceCount > 1
                  ? labels.resourceMany
                  : labels.resourceOne}
              </span>
            </>
          )}
        </>
      }
      action={
        /* Two pills, the same two the reference's hero has. A class that has
           not started yet gets the plain one; a class already running gets the
           resume pill — `px-5`, the progress track, the minutes left, and NO
           word, exactly as the hero drops "Play" once it has progress to show.
           The class IS the thing in progress here, the way the video is
           there. */
        <button
          type="button"
          onClick={onJoin}
          disabled={pending}
          className={cn(
            titleCardPill,
            // The reference's phone page gives the button the whole width;
            // above `sm` it hugs its own content again.
            "w-full justify-center sm:w-auto",
            progress && !pending && "px-5"
          )}
        >
          {/* The play glyph is NOT mirrored under RTL: the reference's own
              Arabic hero points its triangle the same way, because play reads
              as forward in TIME rather than in reading order. */}
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play
              className={cn("size-4 fill-current", progress && "shrink-0")}
            />
          )}
          {pending ? (
            labels.joining
          ) : progress ? (
            <>
              <span className="h-1 w-12 overflow-hidden rounded-full bg-black/20">
                <span
                  className="block h-full rounded-full bg-black"
                  style={{ width: `${progress.percent}%` }}
                />
              </span>
              <span className="text-xs text-black/60">
                {formatRemaining(progress.minutesLeft, labels)}
              </span>
            </>
          ) : (
            labels.join
          )}
        </button>
      }
      note={
        /* A refusal belongs UNDER the button row, not instead of the card, and
           not wrapped around the pill — a flex column there changes how the
           pill sizes and the row stops matching the reference. A student who
           clicks Join on a class that has not started needs to read why while
           still looking at the class. */
        error ? (
          <p
            role="alert"
            className="mx-auto max-w-[42ch] text-center text-sm text-red-300 sm:mx-0 sm:mt-2 sm:text-start"
          >
            {error}
          </p>
        ) : undefined
      }
    />
  )
}
