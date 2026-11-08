"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { ErrorToast } from "@/components/atom/toast"
import { type Locale } from "@/components/internationalization/config"
import { createLiveClassFromTimetable } from "@/components/school-dashboard/live/actions/sessions"
import { liveJoinHref } from "@/components/school-dashboard/live/join-link"

import { isRowLiveJoinable, type LiveClassJoinInfo } from "./live-join-button"
import { inJoinWindow } from "./use-now-ms"

type OpenableSlot = { id: string; dayOfWeek: number }
type OpenablePeriod = { startTime: Date | string; endTime: Date | string }

/**
 * What a click on a read-only timetable cell does.
 *
 * A cell whose class is live (or starting within the join window) TODAY opens
 * the class itself, through the slot's join link (`/live/join/{slot}`), which
 * resolves today's room on the server — or writes it, when the section is
 * online (`onlineToday`) and the sweep has not run yet. Anything else opens the
 * slot's detail dialog, as before. The click is the join: reaching a running
 * class should not take a dialog and a second button.
 *
 * A TEACHER (`canStart`) gets one more branch: their own period, inside the
 * window, with nothing materialized yet — the click starts the class
 * (`createLiveClassFromTimetable`, idempotent within the day) and walks into
 * it. Only when the school teaches live at all (`liveEnabled`, from the
 * school's teaching mode); an in-person school gets the dialog.
 *
 * "Today" is the browser's day, matching the grid's own `realToday` and the
 * block's local-vs-UTC convention. The join map is already today-only on the
 * server; the day check matters for the Start branch, which has no map.
 */
export function useSlotOpen({
  lang,
  liveJoin,
  onlineToday,
  joinWindows,
  onInspect,
  canStart = false,
  startErrorLabel,
}: {
  lang: Locale
  liveJoin: Record<string, LiveClassJoinInfo>
  /** Today's slot ids that are online by policy (`resolveTodayLive`). */
  onlineToday?: ReadonlySet<string>
  /** Today's join windows as instants (`resolveTodayLive.joinWindows`). */
  joinWindows?: Record<string, { fromMs: number; untilMs: number }>
  onInspect: (slotId: string) => void
  canStart?: boolean
  startErrorLabel?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [startingId, setStartingId] = useState<string | null>(null)

  function open(slot: OpenableSlot, period: OpenablePeriod) {
    // The server's window (instants, school zone) when the read sent one —
    // right on any device clock; the old device-clock check otherwise.
    const inWindow = joinWindows
      ? inJoinWindow(Date.now(), joinWindows[slot.id])
      : slot.dayOfWeek === new Date().getDay() &&
        isRowLiveJoinable(period.startTime, period.endTime)
    const target = liveJoin[slot.id]

    // A full navigation, not `router.push`: the join page may answer with a
    // redirect to an external meeting, and it must run fresh on every tap.
    if (inWindow && (target || onlineToday?.has(slot.id))) {
      window.location.assign(liveJoinHref(lang, slot.id))
      return
    }

    if (inWindow && !target && canStart && !pending) {
      setStartingId(slot.id)
      startTransition(async () => {
        const res = await createLiveClassFromTimetable({ timetableId: slot.id })
        if ("success" in res && res.success) {
          router.push(`/${lang}/live/${res.data.id}/room`)
        } else {
          setStartingId(null)
          if (startErrorLabel) ErrorToast(startErrorLabel)
        }
      })
      return
    }

    onInspect(slot.id)
  }

  return { open, startingId: pending ? startingId : null }
}
