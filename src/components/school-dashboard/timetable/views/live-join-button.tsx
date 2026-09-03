"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"

// Mirror of LiveClassJoinInfo from the timetable resolver (kept local so this
// client component has no server import).
export type LiveClassJoinInfo = {
  sessionId: string | null
  provider: "livekit" | "external"
  meetingUrl: string | null
  status: string | null
}

/**
 * "Join live class" button rendered on the timetable Current/Next card.
 * External (or a recurring default link) opens the meeting URL directly;
 * a LiveKit session links to the in-app room.
 */
export function LiveJoinButton({
  liveClass,
  lang,
  label,
  hideIcon,
}: {
  liveClass: LiveClassJoinInfo | null | undefined
  lang: Locale
  label: string
  /**
   * Drop the camera glyph. The Today cards sit in a dense list where the icon
   * is what makes the button findable; the detail dialog already has an
   * illustration and one action, so there the word carries it alone.
   */
  hideIcon?: boolean
}) {
  if (!liveClass) return null

  // External or a recurring default link (no session) → open the meeting URL.
  if (liveClass.provider === "external" || !liveClass.sessionId) {
    if (!liveClass.meetingUrl) return null
    return (
      <Button asChild size="sm" className="gap-2">
        <a
          href={liveClass.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {!hideIcon && <Video className="h-4 w-4" />}
          {label}
        </a>
      </Button>
    )
  }

  // LiveKit session → in-app room.
  return (
    <Button asChild size="sm" className="gap-2">
      <Link href={`/${lang}/live/${liveClass.sessionId}/room`}>
        {!hideIcon && <Video className="h-4 w-4" />}
        {label}
      </Link>
    </Button>
  )
}

/**
 * Whether the Join button should show for the current/next card. Current
 * classes are always joinable; the next class becomes joinable within
 * `windowMin` minutes of its start. Mirrors getCurrentClass's local-vs-UTC
 * time convention used across the timetable views (now read in local time,
 * the period start read in UTC).
 */
export function isLiveJoinable(
  type: "current" | "next",
  startTime: Date | string,
  windowMin = 10
): boolean {
  if (type === "current") return true
  const now = new Date()
  const start = new Date(startTime)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const startMin = start.getUTCHours() * 60 + start.getUTCMinutes()
  return startMin - nowMin <= windowMin && startMin - nowMin >= 0
}

/**
 * Per-ROW version of the gate above, for the "Today" list.
 *
 * `isLiveJoinable` answers the Current/Next card's question ("is THIS the class
 * happening now?"), which the card already knows. A row in the day's list has no
 * such label — it has to work out from its own times whether it is in progress or
 * about to start. Without this the list showed an "Online" badge on every online
 * class of the day and a way to act on exactly one of them.
 *
 * Same local-vs-UTC convention as `isLiveJoinable` and `getCurrentClass`: now is
 * read in the browser's local time, the period bounds are stored as UTC
 * wall-clock. That is the timetable block's standing convention, not a choice
 * made here — it lines up for a viewer in the school's timezone, which is the
 * case that matters.
 */
export function isRowLiveJoinable(
  startTime: Date | string,
  endTime: Date | string,
  windowMin = 10
): boolean {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const start = new Date(startTime)
  const end = new Date(endTime)
  const startMin = start.getUTCHours() * 60 + start.getUTCMinutes()
  const endMin = end.getUTCHours() * 60 + end.getUTCMinutes()
  // In progress, or starting within the window.
  if (nowMin >= startMin && nowMin < endMin) return true
  return startMin - nowMin > 0 && startMin - nowMin <= windowMin
}

/**
 * "Online" marker for a timetable card whose class is ALSO being delivered
 * live today.
 *
 * Shown beside the physical room, never instead of it: online delivery is
 * additive — the room is still where the class meets for anyone who can get
 * there — so the card has to say both. Without this the only difference
 * between a normal Tuesday and a Tuesday the school went online is a Join
 * button that appears ten minutes before the bell.
 *
 * Gated on `sessionId`, NOT on `liveClass` being present: a recurring default
 * link means "there is a room you could use", which every school with a
 * standing Zoom link has. A materialized session for today means "this class
 * is online today", which is the only thing worth a badge.
 */
export function OnlineBadge({
  liveClass,
  label,
}: {
  liveClass: LiveClassJoinInfo | null | undefined
  label: string
}) {
  if (!liveClass?.sessionId) return null
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
      <Video className="h-3 w-3" />
      {label}
    </span>
  )
}

/** A declared HOLIDAY / CANCELLED day, from `getTodaySchedule().closure`. */
export type SchoolClosureInfo = {
  title: string
  exceptionType: string
} | null

/**
 * "School is closed today — عيد الفطر" above the day's cards.
 *
 * Deliberately a notice and not a blank day. `ScheduleException` rows are
 * hand-entered and easy to get wrong, so hiding the whole timetable on one
 * would look broken and leave the reader no way to tell a data error from a
 * real holiday. The pattern still renders underneath; this just says it is not
 * happening. (The conference materialization sweep reads the same predicate and
 * genuinely suppresses — a WRITE on a wrong row is recoverable, a hidden read
 * is not.)
 */
export function ClosureNotice({
  closure,
  label,
}: {
  closure: SchoolClosureInfo
  label: string
}) {
  if (!closure) return null
  return (
    <div className="border-muted-foreground/30 bg-muted/40 text-muted-foreground rounded-lg border border-dashed p-3 text-sm">
      <span className="font-medium">{label}</span>
      {closure.title ? ` — ${closure.title}` : null}
    </div>
  )
}

/** Traffic-light state of an online class, relative to its period today. */
export type LiveSlotStatus = "live" | "upcoming" | "missed"

/**
 * Which lamp is lit for this slot.
 *
 * Keeps the block's local-vs-UTC convention (browser-local `now`, UTC-extracted
 * wall-clock period bounds) — the same one `isRowLiveJoinable` and the role
 * views use. Match it; don't fix one side in isolation.
 *
 * Callers must only ask this of TODAY's slots. It reads clock time alone, so a
 * Monday period would otherwise report "missed" all week — the join/indicator
 * maps are already today-only, which is what keeps that honest.
 */
export function liveSlotStatus(
  startTime: Date | string,
  endTime: Date | string
): LiveSlotStatus {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const start = new Date(startTime)
  const end = new Date(endTime)
  const startMin = start.getUTCHours() * 60 + start.getUTCMinutes()
  const endMin = end.getUTCHours() * 60 + end.getUTCMinutes()
  if (nowMin >= endMin) return "missed"
  if (nowMin >= startMin) return "live"
  return "upcoming"
}

/**
 * Mark colour for each state. Static strings, so Tailwind's JIT can see them —
 * a computed `text-${status}` compiles to nothing, silently.
 */
export const LIVE_STATUS_TEXT: Record<LiveSlotStatus, string> = {
  live: "text-live",
  upcoming: "text-upcoming",
  missed: "text-missed",
}

/**
 * Full-cell "enter the room" target.
 *
 * There is nothing to see: the cell's own blinking background IS the indicator,
 * so adding a glyph on top would say the same thing twice. The anchor stretches
 * over the cell (`absolute inset-0`) and carries only an `aria-label`, which is
 * the entire reason it still exists — a coloured rectangle is unreachable by
 * keyboard and silent to a screen reader.
 *
 * Only rendered on read-only grids. In AdminView the cell is already a click
 * target that opens the slot editor, and two overlapping full-cell targets
 * cannot be disambiguated by a pointer.
 */
export function RoomLinkOverlay({
  liveClass,
  lang,
  label,
}: {
  liveClass: LiveClassJoinInfo
  lang: Locale
  label: string
}) {
  const cls =
    "absolute inset-0 z-[2] rounded-[inherit] focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"

  if (liveClass.provider === "external" || !liveClass.sessionId) {
    if (!liveClass.meetingUrl) return null
    return (
      <a
        href={liveClass.meetingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        aria-label={label}
        title={label}
      />
    )
  }
  return (
    <Link
      href={`/${lang}/live/${liveClass.sessionId}/room`}
      className={cls}
      aria-label={label}
      title={label}
    />
  )
}
