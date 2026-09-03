"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import { asset } from "@/lib/asset-url"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { getSlotDetail } from "../actions"
import { DAY_LABELS_AR, DAY_LABELS_EN } from "../config"
import {
  LiveJoinButton,
  liveSlotStatus,
  type LiveClassJoinInfo,
} from "./live-join-button"

type SlotDetail = Awaited<ReturnType<typeof getSlotDetail>>

/**
 * What one cell means for the person looking at it.
 *
 * Deliberately the same shape as `slot-editor-dialog.tsx` — same `max-w-lg`
 * body, same dot-separated read-only context row — because these are the same
 * gesture in two roles: an admin clicks a cell to CHANGE it, everyone else
 * clicks to UNDERSTAND it. Divergent chrome for the same interaction would read
 * as two different products.
 *
 * The slot facts are identical for everyone who can see the cell; the block
 * below them is not. `getSlotDetail` resolves the viewer from the session and
 * returns their own attendance (a guardian gets their child's, a teacher gets
 * the roster split), which is the entire reason this dialog exists rather than
 * a tooltip.
 */
export function SlotDetailDialog({
  slotId,
  open,
  onOpenChange,
  dictionary,
  lang,
  liveClass,
}: {
  slotId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  dictionary: Dictionary["school"]
  lang: Locale
  liveClass?: LiveClassJoinInfo | null
}) {
  const d = dictionary?.timetable
  const t = d?.slotDetail
  const isRTL = lang === "ar"

  const [loaded, setLoaded] = useState<SlotDetail | null>(null)

  useEffect(() => {
    if (!open || !slotId) return
    let cancelled = false
    getSlotDetail({ timetableId: slotId })
      .then((res) => {
        if (!cancelled) setLoaded(res)
      })
      .catch(() => {
        // A detail panel is not worth an error boundary: the grid behind it is
        // still correct, and the cell can simply be clicked again.
      })
    return () => {
      cancelled = true
    }
  }, [open, slotId])

  // Derived rather than a `loading` flag cleared in the effect: clearing state
  // synchronously on open is what triggers the cascading-render lint, and it is
  // also how a previous cell's details flash into a newly opened dialog for one
  // frame. Comparing the id makes stale data unrenderable by construction.
  const detail = loaded && loaded.id === slotId ? loaded : null

  const formatTime = (value: Date | string | null) => {
    if (!value) return null
    const v = new Date(value)
    // UTC wall-clock, matching how the grid and the seed store period times.
    return `${v.getUTCHours().toString().padStart(2, "0")}:${v
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")}`
  }

  const attendanceLabel = (status: string | null) => {
    if (!status) return t?.notRecorded ?? "No record"
    const map: Record<string, string | undefined> = {
      PRESENT: t?.present,
      ABSENT: t?.absent,
      LATE: t?.late,
      EXCUSED: t?.excused,
      SICK: t?.sick,
    }
    return map[status] ?? status
  }

  // The concrete date of this slot's weekday in the CURRENT week. A timetable
  // row is a weekly PATTERN with no date of its own, so "Thursday" has to be
  // resolved against today to become "3/9".
  const slotDate = (() => {
    if (!detail) return null
    const now = new Date()
    const dt = new Date(now)
    dt.setDate(now.getDate() + (detail.dayOfWeek - now.getDay()))
    return `${dt.getDate()}/${dt.getMonth() + 1}`
  })()

  // Periods are stored as "Period 4"; the ordinal name comes from the
  // dictionary so /ar reads "الحصة الرابعة" rather than a bare digit. Falls
  // back to the stored name if the number cannot be read or is off the end of
  // the list — a school with 12 periods should not render an empty line.
  const periodLabel = (() => {
    const raw = detail?.periodName ?? ""
    const n = parseInt(raw.replace(/[^0-9]/g, ""), 10)
    const list = t?.periods
    if (!Number.isNaN(n) && Array.isArray(list) && list[n - 1])
      return list[n - 1]
    return raw.replace(/^period\s+/i, "")
  })()

  const descLine = detail
    ? [
        slotDate,
        d?.dayNames?.[detail.dayOfWeek] ??
          (isRTL
            ? DAY_LABELS_AR[detail.dayOfWeek]
            : DAY_LABELS_EN[detail.dayOfWeek]),
        formatTime(detail.startTime),
        periodLabel,
      ]
        .filter(Boolean)
        .join(" · ")
    : ""

  // NOTE: named `slotStatus`, not `status`. A bare `status` resolves to the
  // DOM's global `window.status` — a string — so TypeScript accepts it, the
  // build passes, and the comparison below is simply never true. The countdown
  // silently never rendered.
  const slotStatus =
    detail?.startTime &&
    detail?.endTime &&
    detail.dayOfWeek === new Date().getDay()
      ? liveSlotStatus(detail.startTime, detail.endTime)
      : null

  // One short line, never a label/value pair. Before the class starts it is a
  // countdown — the only thing worth knowing then is how long you have. After
  // it starts it is the attendance itself, as a single word.
  const statusLine = (() => {
    if (!detail) return null
    if (slotStatus === "upcoming" && detail.startTime) {
      const now = new Date()
      const start = new Date(detail.startTime)
      const mins =
        start.getUTCHours() * 60 +
        start.getUTCMinutes() -
        (now.getHours() * 60 + now.getMinutes())
      if (mins > 0) {
        return mins >= 60
          ? (t?.startsInHours ?? "Starts in {n} h").replace(
              "{n}",
              String(Math.round(mins / 60))
            )
          : (t?.startsIn ?? "Starts in {n} min").replace("{n}", String(mins))
      }
    }
    if (detail.personal?.kind === "student") {
      return detail.personal.status
        ? attendanceLabel(detail.personal.status)
        : null
    }
    if (detail.personal?.kind === "teacher") {
      return detail.personal.taken
        ? `${detail.personal.present} ${t?.of ?? "of"} ${
            detail.personal.total || detail.personal.present
          }`
        : (t?.notTaken ?? "Not taken yet")
    }
    return null
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Phones get a narrower, shorter sheet: the default dialog is
        // `calc(100% - 2rem)` wide, which on a 390px screen leaves a panel
        // almost as wide as the grid behind it. The vertical padding drops with
        // it, since the content is five short lines.
        className="max-w-[17rem] md:max-w-sm"
        aria-describedby={undefined}
      >
        {/* Radix requires a title for the a11y tree; the visual heading is the
            subject below, so this one is screen-reader only. */}
        <DialogHeader className="sr-only">
          <DialogTitle>{detail?.subject || (t?.title ?? "Class")}</DialogTitle>
        </DialogHeader>

        {!detail ? (
          <div className="space-y-2 px-6 py-8 md:px-8 md:py-10">
            <Skeleton className="mx-auto h-14 w-14 rounded-full" />
            <Skeleton className="mx-auto h-4 w-32" />
            <Skeleton className="mx-auto h-5 w-40" />
          </div>
        ) : (
          <div className="px-6 py-8 text-center md:px-8 md:py-10">
            {/* eslint-disable-next-line @next/next/no-img-element --
                deliberately not next/image: cdn.databayt.org already sets
                immutable headers (see next.config), so routing this through
                /_next/image would only add a hop, and a vector has nothing for
                the optimizer to do. */}
            <img
              src={asset("https://cdn.databayt.org/anthropic/clock.svg")}
              alt=""
              aria-hidden="true"
              className="mx-auto mb-3 size-14 md:size-16"
            />

            {/* Subject first, then its coordinates, then who teaches it —
                largest to smallest, one line each, tight. */}
            <h5 className="mb-1">{detail.subject}</h5>

            <p className="text-muted-foreground mb-1 text-xs">{descLine}</p>

            {detail.teacher && (
              <p className="text-muted-foreground text-xs">{detail.teacher}</p>
            )}

            {statusLine && (
              <p className="mt-2 text-xs font-medium">{statusLine}</p>
            )}

            {liveClass && (
              <div className="mt-4">
                <LiveJoinButton
                  liveClass={liveClass}
                  lang={lang}
                  hideIcon
                  label={t?.enter ?? (isRTL ? "ادخل" : "Enter")}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
