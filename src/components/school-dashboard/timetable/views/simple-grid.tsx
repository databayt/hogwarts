"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, type CSSProperties, type ReactNode } from "react"
import { Clock, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"

import {
  DAY_LABELS_AR,
  DAY_LABELS_EN,
  EMPTY_CELL_STYLE,
  getSubjectTailwind,
} from "../config"
import { LIVE_STATUS_TEXT, liveSlotStatus } from "./live-join-button"
import { LiveMark } from "./live-mark"

interface Slot {
  id: string
  dayOfWeek: number
  periodId: string
  periodName?: string
  subject?: string
  teacher?: string
  className?: string
  room?: string
  roomId?: string
  teacherId?: string
  classId?: string
  sectionName?: string
  subjectName?: string
}

interface Period {
  id: string
  name: string
  order: number
  startTime: Date | string
  endTime: Date | string
  isBreak: boolean
}

interface SimpleGridProps {
  slots: Slot[]
  workingDays: number[]
  periods: Period[]
  isRTL?: boolean
  viewMode?: "class" | "teacher" | "room"
  editable?: boolean
  onSlotClick?: (day: number, periodId: string, slot?: Slot) => void
  /** Highlight the current day column */
  highlightToday?: boolean
  /** Set of slot IDs that have conflicts (shown with red ring) */
  conflictSlotIds?: Set<string>
  /**
   * Map of timetable slot id -> today's Conference state, from
   * `getLiveClassIndicators`. Renders a small "live now" / "scheduled today"
   * dot on the matching cell — a lightweight awareness signal, not a Join
   * affordance (Join stays on the Today cards).
   */
  liveIndicators?: Record<string, "live" | "scheduled">
  /**
   * Per-cell action, rendered under the slot's text. Deliberately a render prop
   * rather than a pile of live-class props: what belongs in a cell is a ROLE
   * question (a student joins, a teacher may instead need to start the class),
   * and the role views are where that already lives. The grid stays ignorant of
   * Conference entirely and just gives the cell a place to put something.
   */
  renderSlotAction?: (slot: Slot, period: Period) => ReactNode
  /**
   * Read-only grids: open the slot's detail dialog. Mutually exclusive with
   * `onSlotClick` by construction — an editable cell opens the slot EDITOR, a
   * read-only one opens the detail view. Same gesture, different verb.
   */
  onSlotInspect?: (slot: Slot) => void
  dictionary?: {
    period?: string
    /** Label for any non-teaching period (الفسحة / استراحة). */
    break?: string
    days?: string[]
    conflict?: string
    liveNow?: string
    scheduledToday?: string
  }
}

export default function SimpleGrid({
  slots,
  workingDays,
  periods,
  isRTL = false,
  viewMode = "class",
  editable = false,
  onSlotClick,
  highlightToday = false,
  conflictSlotIds,
  liveIndicators,
  renderSlotAction,
  onSlotInspect,
  dictionary,
}: SimpleGridProps) {
  const liveNowLabel =
    dictionary?.liveNow ?? (isRTL ? "مباشر الآن" : "Live now")
  const scheduledTodayLabel =
    dictionary?.scheduledToday ?? (isRTL ? "مجدول اليوم" : "Scheduled today")

  // Get current day for highlighting
  const today = highlightToday ? new Date().getDay() : -1

  // The day a reader is actually living in, resolved independently of
  // `highlightToday` — that prop is a caller's styling choice (the student turns
  // it off in day mode), and emphasis must not ride on it. A weekend fallback
  // column is never `realToday`, so it falls out unemphasised for free.
  const realToday = new Date().getDay()

  // Break rows are DATA-driven: every non-teaching period renders in its real
  // time slot, keyed to the teaching period it precedes.
  //
  // This replaces a single "Lunch" row positioned by `lunchAfterPeriod`, which
  // was broken three ways at once: it read `SchoolWeekConfig.defaultLunchAfterPeriod`
  // (the demo has NO SchoolWeekConfig row, so it was null and the row NEVER
  // rendered — every break was invisible); it found the period by matching the
  // English substring "lunch" against a user-editable name (so an Arabic
  // «فسحة» could never match); and it could only ever show ONE break, while a
  // Sudanese day has two. Sudanese schools break for فطور mid-morning and eat
  // الغداء at home after dismissal — there is no school lunch to model.
  const breaksBeforePeriod = useMemo(() => {
    const map = new Map<string, Period[]>()
    const byTime = [...periods].sort(
      (a, b) => +new Date(a.startTime) - +new Date(b.startTime)
    )
    let pending: Period[] = []
    for (const p of byTime) {
      if (p.isBreak) {
        pending.push(p)
        continue
      }
      if (pending.length > 0) {
        map.set(p.id, pending)
        pending = []
      }
    }
    return map
  }, [periods])

  // Build a map for quick slot lookup
  const slotMap = useMemo(() => {
    const map = new Map<string, Slot>()
    for (const slot of slots) {
      map.set(`${slot.dayOfWeek}-${slot.periodId}`, slot)
    }
    return map
  }, [slots])

  // Format time from Date
  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`
  }

  // Get display text based on view mode
  const getSlotDisplay = (slot: Slot) => {
    // Prefer subjectName (denormalized from section-based data) over subject
    const subjectLabel = slot.subjectName || slot.subject || ""
    const sectionLabel = slot.sectionName

    switch (viewMode) {
      case "teacher":
        // Teacher view: show subject (+ section) as primary, room as secondary
        return {
          primary: sectionLabel
            ? `${subjectLabel} - ${sectionLabel}`
            : slot.className || subjectLabel,
          secondary: slot.room || "",
        }
      case "room":
        return {
          primary: subjectLabel || slot.className || "",
          secondary: sectionLabel
            ? `${slot.teacher || ""} ${slot.teacher && sectionLabel ? "·" : ""} ${sectionLabel}`.trim()
            : slot.teacher || "",
        }
      case "class":
      default:
        return {
          primary: subjectLabel,
          secondary: sectionLabel
            ? `${slot.teacher || ""} ${slot.teacher && sectionLabel ? "·" : ""} ${sectionLabel}`.trim()
            : slot.teacher || "",
        }
    }
  }

  // Sort working days for RTL
  const sortedDays = isRTL ? [...workingDays].reverse() : workingDays

  // Filter periods (teaching only, no breaks)
  const teachingPeriods = periods.filter((p) => !p.isBreak)

  // The period the reader is in, or the one about to start — the single cell in
  // the whole grid worth looking at right now. Local `now` against UTC-extracted
  // period bounds, matching the convention `isRowLiveJoinable` and the role
  // views already use; don't "fix" one side of it in isolation.
  const activePeriodId = (() => {
    const now = new Date()
    const nowMin = now.getHours() * 60 + now.getMinutes()
    let next: { id: string; startMin: number } | null = null
    for (const p of teachingPeriods) {
      const st = new Date(p.startTime)
      const en = new Date(p.endTime)
      const startMin = st.getUTCHours() * 60 + st.getUTCMinutes()
      const endMin = en.getUTCHours() * 60 + en.getUTCMinutes()
      if (nowMin >= startMin && nowMin < endMin) return p.id
      if (startMin > nowMin && (!next || startMin < next.startMin)) {
        next = { id: p.id, startMin }
      }
    }
    return next?.id ?? null
  })()

  // Calculate grid columns class
  const totalCols = sortedDays.length + 1

  // Below `md` the grid used to divide the viewport by `totalCols`, so a
  // five-day week rendered ~65px columns on a phone — two Arabic words per cell,
  // wrapped to shreds. Give every column a readable floor and let the
  // already-present `overflow-x-auto` scroll instead of compressing.
  //
  // Expressed as a floor, not a fixed width, so it costs nothing where there is
  // room: on a laptop the natural column is ~170px and the min never binds, and
  // in a 2-column day view the total floor (256px) is under any viewport. It
  // rides a CSS variable rather than an inline `minWidth` so that
  // `print:min-w-0` can still beat it — an inline style could not be overridden,
  // and 768px of forced width would clip on A4.
  const MIN_COL_PX = 128

  // The period column pins itself while the days scroll under it, so a phone
  // never loses track of which row it is reading. `start-0` (not `left-0`) so it
  // pins to the right edge in RTL, where the period column actually sits.
  //
  // Applied at every width on purpose: sticky is inert without a scroll to stick
  // through, so this needs no breakpoint — it only becomes visible in the same
  // situation the min-width floor above creates. `z-10` because the day cells are
  // `relative` and come LATER in the DOM, so they would otherwise paint over it;
  // and each pinned cell needs its own opaque background or the scrolled columns
  // show through. `print:static` keeps A4 out of it.
  const STICKY_PERIOD_COL = "sticky start-0 z-10 print:static"
  const gridColsClass = (() => {
    switch (totalCols) {
      case 2:
        return "grid-cols-2"
      case 3:
        return "grid-cols-3"
      case 4:
        return "grid-cols-4"
      case 5:
        return "grid-cols-5"
      case 6:
        return "grid-cols-6"
      case 7:
        return "grid-cols-7"
      case 8:
        return "grid-cols-8"
      default:
        return "grid-cols-6"
    }
  })()

  // Calculate lunch col span
  const lunchColSpan = (() => {
    switch (sortedDays.length) {
      case 1:
        return "col-span-1"
      case 2:
        return "col-span-2"
      case 3:
        return "col-span-3"
      case 4:
        return "col-span-4"
      case 5:
        return "col-span-5"
      case 6:
        return "col-span-6"
      case 7:
        return "col-span-7"
      default:
        return "col-span-5"
    }
  })()

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 shadow-lg dark:border-neutral-700 print:rounded-none print:shadow-none">
      <div
        className="w-full min-w-[var(--tt-grid-min-w)] bg-white dark:bg-neutral-900 print:min-w-0"
        style={
          {
            "--tt-grid-min-w": `${totalCols * MIN_COL_PX}px`,
          } as CSSProperties
        }
      >
        {/* Header */}
        <div
          className={cn(
            "grid border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
            gridColsClass
          )}
        >
          <div
            className={cn(
              "flex flex-col items-center justify-center border-e border-neutral-200 bg-neutral-50 px-2 py-3 text-neutral-500 sm:px-8 sm:py-5 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 print:py-3",
              STICKY_PERIOD_COL
            )}
          >
            <Clock className="h-4 w-4 print:h-5 print:w-5" />
          </div>
          {sortedDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                "px-4 py-2 text-center text-sm font-medium text-neutral-700 sm:px-8 sm:py-5 sm:text-base dark:text-neutral-300",
                // Today is marked on the HEADER, where there is no subject
                // colour to compete with.
                day === today && "bg-primary/5 text-foreground font-semibold",
                index < sortedDays.length - 1
                  ? "border-e border-neutral-200 dark:border-neutral-700"
                  : "",
                "print:py-3 print:text-base print:font-semibold"
              )}
            >
              {dictionary?.days?.[day] ??
                (isRTL ? DAY_LABELS_AR[day] : DAY_LABELS_EN[day])}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {teachingPeriods.map((period) => (
            <div key={period.id}>
              {/* Break row(s) preceding this teaching period, in real time order */}
              {breaksBeforePeriod.get(period.id)?.map((br) => (
                <div key={br.id} className={cn("grid", gridColsClass)}>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 py-3 sm:px-8 sm:py-5 dark:border-neutral-700 dark:bg-neutral-800",
                      STICKY_PERIOD_COL
                    )}
                  >
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {dictionary?.break ?? "Break"}
                    </span>
                    <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      ({formatTime(br.startTime)})
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center bg-neutral-50 px-2 py-3 sm:px-8 sm:py-5 dark:bg-neutral-800/50",
                      lunchColSpan
                    )}
                  >
                    <span className="font-medium text-neutral-500 dark:text-neutral-400">
                      {formatTime(br.startTime)} - {formatTime(br.endTime)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Regular Period Row */}
              <div className={cn("grid", gridColsClass)}>
                {/* Period Cell */}
                <div
                  className={cn(
                    "flex flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 py-3 sm:px-8 sm:py-5 dark:border-neutral-700 dark:bg-neutral-800 print:py-3",
                    STICKY_PERIOD_COL
                  )}
                >
                  <span className="text-sm font-medium text-neutral-700 sm:text-base dark:text-neutral-300 print:text-sm">
                    {(dictionary?.period ?? "Period") + " "}
                    {/* Period names are stored as the full "Period 1"; strip the
                        redundant prefix so the dictionary label isn't doubled
                        ("Period Period 1" → "Period 1" / "الحصة 1"). */}
                    {period.name.replace(/^period\s+/i, "")}
                  </span>
                  <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    ({formatTime(period.startTime)})
                  </span>
                </div>

                {/* Day Cells */}
                {sortedDays.map((day, dayIdx) => {
                  const slot = slotMap.get(`${day}-${period.id}`)
                  const display = slot ? getSlotDisplay(slot) : null
                  const isConflicted =
                    slot &&
                    conflictSlotIds &&
                    (conflictSlotIds.has(slot.id) ||
                      conflictSlotIds.has(slot.classId || ""))
                  const liveState = slot ? liveIndicators?.[slot.id] : undefined
                  const slotAction = slot
                    ? renderSlotAction?.(slot, period)
                    : null
                  const inspectable = !!slot && !editable && !!onSlotInspect
                  const isNowCell =
                    day === realToday && period.id === activePeriodId
                  // Traffic light, only for TODAY: the indicator/join maps are
                  // today-only, so a cell on another day never reaches this.
                  // EXACTLY ONE lamp is lit: the class you are in, or the one
                  // coming next. Colouring every online slot turned today's
                  // column into a wall of blinking red and amber and buried the
                  // one cell that actually needs acting on — a strip of lights
                  // reads as decoration, a single light reads as an instruction.
                  //
                  // `isNowCell` is already "current period, else next", so the
                  // lamp is green while a class runs and amber before it starts;
                  // once the school day ends nothing is current or next and the
                  // grid goes quiet on its own.
                  const isOnlineToday = day === realToday && !!liveState
                  const status =
                    isOnlineToday && isNowCell
                      ? liveSlotStatus(period.startTime, period.endTime)
                      : null

                  return (
                    <div
                      key={`${day}-${period.id}`}
                      className={cn(
                        "relative flex min-h-14 flex-col items-center justify-center px-2 py-2 transition-all duration-200 sm:min-h-20 sm:px-4 sm:py-4",
                        // Cells keep their subject colour, always. State is
                        // carried by the mark in the corner, never by the
                        // background — a grid where the background means two
                        // different things at once cannot be read at a glance,
                        // and a blinking one reads as decoration.
                        slot && display?.primary
                          ? getSubjectTailwind(display.primary)
                          : EMPTY_CELL_STYLE,
                        dayIdx < sortedDays.length - 1
                          ? "border-e border-neutral-200 dark:border-neutral-700"
                          : "",
                        // The today wash only ever lands on EMPTY cells. On a
                        // filled one `cn()` collapses the two `bg-*` utilities
                        // to the last, so the wash silently REPLACED the
                        // subject colour — which is why today's column rendered
                        // grey while every other day was colour-coded. Today
                        // stays identifiable through its header tint and the
                        // ring below, neither of which competes for background.
                        day === today && !slot && "bg-primary/5",
                        // ring-INSET: an outset ring is drawn beyond the cell
                        // box, where the scroll container clips it and the
                        // neighbouring column paints over it — which is why one
                        // edge kept going missing. Inset draws within the cell's
                        // own bounds, so all four sides always survive.
                        // No ring: on a solid lamp an outline is noise, and the
                        // running class is already the only green one.
                        isNowCell && "z-[1]",
                        (editable || inspectable) &&
                          "cursor-pointer hover:shadow-inner",
                        isConflicted && "ring-2 ring-red-500",
                        "print:min-h-12 print:py-2"
                      )}
                      onClick={() => {
                        if (editable) onSlotClick?.(day, period.id, slot)
                        else if (slot) onSlotInspect?.(slot)
                      }}
                    >
                      {status && (
                        // ONLY the focused cell is marked. Marking every online
                        // class put a row of identical badges down the column
                        // and made the one that matters indistinguishable —
                        // same failure as the blinking backgrounds, quieter.
                        <>
                          <LiveMark
                            className={cn(
                              "absolute end-1 top-1 text-[1.25rem] print:hidden",
                              LIVE_STATUS_TEXT[status]
                            )}
                          />
                          <span className="sr-only">
                            {status === "live"
                              ? liveNowLabel
                              : scheduledTodayLabel}
                          </span>
                        </>
                      )}
                      {slot && display ? (
                        <>
                          {/* Conflict is not signalled by colour alone (the red
                              ring) — surface an icon + screen-reader text too. */}
                          {isConflicted && (
                            <>
                              <TriangleAlert
                                className="mb-0.5 h-3 w-3 text-red-600 dark:text-red-400"
                                aria-hidden="true"
                              />
                              <span className="sr-only">
                                {dictionary?.conflict ?? "Conflict"}:{" "}
                              </span>
                            </>
                          )}
                          <span className="text-center text-xs font-medium text-neutral-800 sm:text-sm dark:text-neutral-100 print:text-xs">
                            {display.primary}
                          </span>
                          {display.secondary && (
                            <span className="mt-0.5 text-xs text-neutral-600 sm:mt-1 dark:text-neutral-400 print:text-[10px]">
                              {display.secondary}
                            </span>
                          )}
                          {slotAction && (
                            // stopPropagation: in AdminView the whole cell is a
                            // click target that opens the slot editor, so a Join
                            // link inside one would open the editor on the very
                            // same click.
                            <span
                              className="mt-1 print:hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {slotAction}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-600">
                          {editable ? "+" : "-"}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
