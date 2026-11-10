"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { typographyVariants } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { type Locale } from "@/components/internationalization/config"
import { JoinLinkButton } from "@/components/school-dashboard/timetable/views/join-link-button"
import {
  inJoinWindow,
  useNowMs,
} from "@/components/school-dashboard/timetable/views/use-now-ms"

export type TodayJoinRow = {
  timetableId: string
  subject: string
  /** The join window as instants (server, school zone). */
  fromMs: number
  untilMs: number
  /** The room is already live (the teacher started it). */
  live: boolean
}

/**
 * One tap into the class that is on now, on the PHONE dashboard.
 *
 * The phone day grid under it is server-rendered and cannot decide "now"
 * without a hydration mismatch (server zone UTC, reader's zone Khartoum — see
 * the note in `today-timetable.tsx`), so on a phone the dashboard had no way
 * into a class at all: the Today cards are desktop-only and the banner rotates.
 * This island renders NOTHING until it has mounted, then picks the class whose
 * join window (instants from the server, in the school's zone) holds now —
 * right on any device clock — and re-picks every 30 seconds, so a dashboard
 * opened before the bell grows its Join without a reload.
 */
export function TodayJoinStrip({
  rows,
  lang,
  isTeacher,
  labels,
}: {
  rows: TodayJoinRow[]
  lang: Locale
  isTeacher: boolean
  labels: { join: string; start: string; liveNow: string }
}) {
  // `null` until mounted (nothing renders before the clock is real), then
  // re-read every 30 s.
  const nowMs = useNowMs()
  const row = rows.find((r) => inJoinWindow(nowMs, r))
  if (!row) return null

  return (
    <div className="bg-muted/50 mb-4 flex items-center justify-between gap-3 rounded-2xl p-3">
      <div className="min-w-0">
        <p className={cn(typographyVariants.cardTitle, "truncate")}>
          {row.subject}
        </p>
        {row.live ? (
          <p className={cn(typographyVariants.hint, "mt-1")}>
            {labels.liveNow}
          </p>
        ) : null}
      </div>
      <JoinLinkButton
        timetableId={row.timetableId}
        lang={lang}
        label={labels.join}
        className="h-9 px-4"
      />
    </div>
  )
}
