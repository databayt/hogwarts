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
      <Link href={`/${lang}/live-classes/${liveClass.sessionId}/room`}>
        <Video className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
}

/**
 * Whether the Join button should show on the current/next card for a given
 * live class. The gate is both **provider-aware** and time-windowed:
 *
 * - No live class, or one that has `ended`/`cancelled` → never joinable.
 * - **LiveKit session**: a student/guardian can only join once the room is
 *   `live` — the server rejects participants on a still-`scheduled` room
 *   (only the host can start it; see `live-classes/actions/tokens.ts`). A host
 *   (teacher/admin) may open a `scheduled` room to start it, so pass
 *   `canHostScheduled: true` from the teacher view.
 * - **External / recurring default link**: no live-state machine (external
 *   sessions never auto-flip to `live`), so joinability is purely the time
 *   window below.
 *
 * Time window: a `current` class is always in-window; a `next` class becomes
 * joinable within `windowMin` minutes of its start. Times are compared in UTC
 * on both sides — Period times are stored as `@db.Time` UTC wall-clock and are
 * displayed across the timetable via `getUTCHours()`, so "now" is read the same
 * way to keep the comparison internally consistent.
 *
 * NOTE: true per-school-timezone correctness needs a `School.timezone` field
 * (a follow-up) — this keeps the join window consistent with how the grid
 * already renders period times rather than mixing local and UTC clocks.
 */
export function isLiveJoinable(
  liveClass: LiveClassJoinInfo | null | undefined,
  type: "current" | "next",
  startTime: Date | string,
  opts: { canHostScheduled?: boolean; windowMin?: number } = {}
): boolean {
  if (!liveClass) return false
  if (liveClass.status === "ended" || liveClass.status === "cancelled") {
    return false
  }

  const { canHostScheduled = false, windowMin = 10 } = opts

  // LiveKit room that is not yet live: only a host may open it.
  const isLivekitSession =
    liveClass.provider === "livekit" && !!liveClass.sessionId
  if (isLivekitSession && liveClass.status !== "live" && !canHostScheduled) {
    return false
  }

  if (type === "current") return true
  const now = new Date()
  const start = new Date(startTime)
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes()
  const startMin = start.getUTCHours() * 60 + start.getUTCMinutes()
  return startMin - nowMin <= windowMin && startMin - nowMin >= 0
}
