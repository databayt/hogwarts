"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import { type Locale } from "@/components/internationalization/config"
import {
  isRowLiveJoinable,
  LiveJoinButton,
  OnlineBadge,
  type LiveClassJoinInfo,
} from "@/components/school-dashboard/timetable/views/live-join-button"

/**
 * The live-class affordance for one row of the dashboard's "Today" card: the
 * Online marker whenever the class is also online today, and Join while it is
 * running or about to start.
 *
 * A separate client leaf because `isRowLiveJoinable` reads the browser clock
 * and lives in a "use client" module — the dashboard card is a Server
 * Component and cannot call it directly. Reuses the timetable's own
 * components so the dashboard and the timetable never disagree about what
 * "joinable" means.
 */
export function TodayLiveAction({
  liveClass,
  startTime,
  endTime,
  lang,
  joinLabel,
  onlineLabel,
}: {
  liveClass: LiveClassJoinInfo | null | undefined
  startTime: string
  endTime: string
  lang: Locale
  joinLabel: string
  onlineLabel: string
}) {
  // Re-read the clock every 30 s: a dashboard opened at 07:40 for an 08:00
  // class must grow its Join button without a reload.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!liveClass) return null
  return (
    <span className="flex shrink-0 items-center gap-2">
      <OnlineBadge liveClass={liveClass} label={onlineLabel} />
      {isRowLiveJoinable(startTime, endTime) && (
        <LiveJoinButton liveClass={liveClass} lang={lang} label={joinLabel} />
      )}
    </span>
  )
}
