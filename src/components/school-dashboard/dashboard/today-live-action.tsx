"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { type Locale } from "@/components/internationalization/config"
import { JoinLinkButton } from "@/components/school-dashboard/timetable/views/join-link-button"
import {
  isRowLiveJoinable,
  LiveJoinButton,
  OnlineBadge,
  type LiveClassJoinInfo,
} from "@/components/school-dashboard/timetable/views/live-join-button"
import {
  inJoinWindow,
  useNowMs,
} from "@/components/school-dashboard/timetable/views/use-now-ms"

/**
 * The live-class affordance for one row of the dashboard's "Today" card: the
 * Online marker whenever the class is also online today, and Join (or Start,
 * for the teacher) while it is running or about to start.
 *
 * Join goes through the slot's join link (`/live/join/{slot}`), which resolves
 * today's room on the server and writes it when the section is online but the
 * sweep has not run — so a row needs either a room (`liveClass`) or the policy
 * (`online`) to offer it. The teacher's card used to promise a Start button it
 * did not have: with no room yet this rendered nothing at all.
 *
 * A separate client leaf because `isRowLiveJoinable` reads the browser clock
 * and lives in a "use client" module — the dashboard card is a Server
 * Component and cannot call it directly. Reuses the timetable's own
 * components so the dashboard and the timetable never disagree about what
 * "joinable" means.
 */
export function TodayLiveAction({
  liveClass,
  online = false,
  timetableId,
  joinWindow,
  startTime,
  endTime,
  lang,
  joinLabel,
  startLabel,
  onlineLabel,
}: {
  liveClass: LiveClassJoinInfo | null | undefined
  /** The section is online by policy today (see `TodayLiveClass`). */
  online?: boolean
  /** The row's timetable slot — required for the join link. */
  timetableId?: string
  /** Today's join window as instants (server, school zone). Preferred over
   *  the device-clock check whenever present. */
  joinWindow?: { fromMs: number; untilMs: number } | null
  startTime: string
  endTime: string
  lang: Locale
  joinLabel: string
  /** The teacher's verb while the room is not live yet. */
  startLabel?: string
  onlineLabel: string
}) {
  // The reader's clock, re-read every 30 s: a dashboard opened at 07:40 for
  // an 08:00 class must grow its Join button without a reload. `null` until
  // mounted, so the server render shows no Join and cannot disagree with the
  // client about the moment.
  const nowMs = useNowMs()

  if (!liveClass && !online) return null
  const inWindow =
    nowMs !== null &&
    (joinWindow
      ? inJoinWindow(nowMs, joinWindow)
      : isRowLiveJoinable(startTime, endTime))
  // A timetable class is a classroom that is there at its time: the teacher
  // walks in like the students do, so the slot's button always says Join.
  // (`startLabel` stays in the props for callers; it no longer applies.)
  const label = joinLabel
  return (
    <span className="flex shrink-0 items-center gap-2">
      {liveClass ? (
        <OnlineBadge liveClass={liveClass} label={onlineLabel} />
      ) : null}
      {inWindow &&
        (timetableId ? (
          <JoinLinkButton timetableId={timetableId} lang={lang} label={label} />
        ) : (
          <LiveJoinButton liveClass={liveClass} lang={lang} label={joinLabel} />
        ))}
    </span>
  )
}
