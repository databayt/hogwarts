"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import { PROGRESS_BAR } from "@/components/lumos/shared/video-player/constants"

import type { RoomLabels } from "./labels"

/** `07:22`, or `1:05:22` past the hour — the player's own clock format. */
function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
  const ss = String(s % 60).padStart(2, "0")
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

interface ClassProgressProps {
  startsAtMs: number | null
  endsAtMs: number | null
  labels: Pick<RoomLabels, "live" | "classProgress" | "elapsed" | "remaining">
}

/**
 * The player's scrubber row, on a class: the same 5px track and white thumb,
 * elapsed on the start side and time left on the end side — and no seeking,
 * because a class has no timeline to drag through. The thumb is the
 * reference's shape kept for the eye; the row is a progress bar, not a
 * slider, and says so to assistive tech.
 *
 * Ticks once a second in its OWN state so the second hand never re-renders
 * the room around it — the LiveKit tree above this is the expensive part of
 * the page. The pre-join card's `useClassProgress` ticks every thirty seconds
 * for a minutes-only chip; this one prints seconds, so it keeps its own clock
 * rather than widening that hook.
 *
 * A class with no clock (an open room) renders nothing, and the card is left
 * holding only the row of controls.
 */
export function ClassProgress({
  startsAtMs,
  endsAtMs,
  labels,
}: ClassProgressProps) {
  // Mounted only after the join, on the client, so a clock in the initial
  // state cannot disagree with a server render — there is none.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (startsAtMs === null || endsAtMs === null) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [startsAtMs, endsAtMs])

  if (startsAtMs === null || endsAtMs === null) return null
  const span = endsAtMs - startsAtMs
  if (span <= 0) return null

  // Before the start (a teacher in early) the bar sits at zero with the whole
  // class ahead; after the end it sits full while elapsed keeps counting, the
  // way the reference's clock runs on past a live stream's slated end.
  const elapsedMs = Math.max(0, now - startsAtMs)
  const remainingMs = Math.max(0, endsAtMs - Math.max(now, startsAtMs))
  const percent = Math.min(100, (elapsedMs / span) * 100)
  const elapsed = formatClock(elapsedMs / 1000)
  const remaining = formatClock(remainingMs / 1000)

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-label={labels.classProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`${labels.elapsed} ${elapsed} · ${labels.remaining} ${remaining}`}
        className="relative w-full rounded-full bg-white/30"
        style={{ height: PROGRESS_BAR.heightRest }}
      >
        <div
          className="absolute inset-y-0 start-0 rounded-full bg-white"
          style={{ width: `${percent}%` }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{
            insetInlineStart: `calc(${percent}% - ${PROGRESS_BAR.thumbWidth / 2}px)`,
            width: PROGRESS_BAR.thumbWidth,
            height: PROGRESS_BAR.thumbHeight,
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
        />
      </div>
      {/* Latin figures, kept LTR inside the RTL row: `−07:22` must never come
          out as `07:22−`. Elapsed on the START side and time left on the END,
          the way the reference's own Arabic player lays them. */}
      <div className="flex items-center justify-between text-[11px] text-white/70 tabular-nums">
        <span dir="ltr">{elapsed}</span>
        <span className="flex items-center gap-1 font-medium text-white">
          <span className="size-1.5 rounded-full bg-red-500" aria-hidden />
          {labels.live}
        </span>
        <span dir="ltr">−{remaining}</span>
      </div>
    </div>
  )
}
