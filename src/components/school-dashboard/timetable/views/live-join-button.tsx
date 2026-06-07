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
