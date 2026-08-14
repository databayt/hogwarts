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
}: {
  liveClass: LiveClassJoinInfo | null | undefined
  lang: Locale
  label: string
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
          <Video className="h-4 w-4" />
          {label}
        </a>
      </Button>
    )
  }

  // LiveKit session → in-app room.
  return (
    <Button asChild size="sm" className="gap-2">
      <Link href={`/${lang}/conference/${liveClass.sessionId}/room`}>
        <Video className="h-4 w-4" />
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
