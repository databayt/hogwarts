// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useMemo } from "react"
import { Building2, Clock, GraduationCap, UserCheck, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { ConflictDetail } from "./actions/conflict-detection"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConflictDisplayProps {
  conflicts: ConflictDetail[]
  examDate: Date
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  onSlotSelect?: (startTime: string, endTime: string) => void
  locale: "en" | "ar"
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_START_HOUR = 7
const DAY_END_HOUR = 17
const SLOT_MINUTES = 30
const ROW_HEIGHT_PX = 36

const TOTAL_SLOTS = ((DAY_END_HOUR - DAY_START_HOUR) * 60) / SLOT_MINUTES

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

function formatTimeLabel(
  hour: number,
  minute: number,
  locale: "en" | "ar"
): string {
  const m = minute.toString().padStart(2, "0")
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  if (locale === "ar") {
    const period = hour < 12 ? "ص" : "م"
    return `${h12}:${m} ${period}`
  }
  const period = hour < 12 ? "AM" : "PM"
  return `${h12}:${m} ${period}`
}

/** Convert a time range to grid row positions (1-indexed for CSS grid). */
function timeRangeToGridRows(
  start: string,
  end: string
): { rowStart: number; rowEnd: number } {
  const startMins = timeToMinutes(start)
  const endMins = timeToMinutes(end)
  const gridStart = Math.max(0, startMins - DAY_START_HOUR * 60)
  const gridEnd = Math.min(
    TOTAL_SLOTS * SLOT_MINUTES,
    endMins - DAY_START_HOUR * 60
  )
  // Each row = SLOT_MINUTES, CSS grid rows are 1-indexed
  const rowStart = Math.floor(gridStart / SLOT_MINUTES) + 1
  const rowEnd = Math.ceil(gridEnd / SLOT_MINUTES) + 1
  return { rowStart, rowEnd }
}

// ---------------------------------------------------------------------------
// Conflict type icon mapping
// ---------------------------------------------------------------------------

const CONFLICT_TYPE_ICONS: Record<ConflictDetail["type"], typeof Users> = {
  class: GraduationCap,
  teacher: UserCheck,
  classroom: Building2,
  student: Users,
}

const CONFLICT_TYPE_LABELS: Record<
  ConflictDetail["type"],
  Record<"en" | "ar", string>
> = {
  class: { en: "Class", ar: "الفصل" },
  teacher: { en: "Teacher", ar: "المعلم" },
  classroom: { en: "Classroom", ar: "الغرفة" },
  student: { en: "Student", ar: "الطالب" },
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

function severityBadgeClassName(severity: ConflictDetail["severity"]): string {
  switch (severity) {
    case "high":
      return ""
    case "medium":
      return "border-transparent bg-amber-500 text-white"
    case "low":
      return "border-transparent bg-blue-500 text-white"
  }
}

function severityLabel(
  severity: ConflictDetail["severity"],
  locale: "en" | "ar"
): string {
  const labels: Record<
    ConflictDetail["severity"],
    Record<"en" | "ar", string>
  > = {
    high: { en: "High", ar: "عالي" },
    medium: { en: "Medium", ar: "متوسط" },
    low: { en: "Low", ar: "منخفض" },
  }
  return labels[severity][locale]
}

// ---------------------------------------------------------------------------
// Compute available slots (gaps between conflicts and proposed exam)
// ---------------------------------------------------------------------------

interface AvailableGap {
  startTime: string
  endTime: string
}

function computeAvailableGaps(
  conflicts: ConflictDetail[],
  proposedStart: string,
  proposedEnd: string
): AvailableGap[] {
  // Collect all occupied ranges
  const occupied: { start: number; end: number }[] = []

  for (const c of conflicts) {
    const parts = c.conflictTime.split(" - ")
    if (parts.length === 2) {
      occupied.push({
        start: timeToMinutes(parts[0].trim()),
        end: timeToMinutes(parts[1].trim()),
      })
    }
  }

  // Add the proposed exam time as occupied
  occupied.push({
    start: timeToMinutes(proposedStart),
    end: timeToMinutes(proposedEnd),
  })

  // Sort by start time
  occupied.sort((a, b) => a.start - b.start)

  // Merge overlapping ranges
  const merged: { start: number; end: number }[] = []
  for (const range of occupied) {
    if (merged.length === 0 || range.start > merged[merged.length - 1].end) {
      merged.push({ ...range })
    } else {
      merged[merged.length - 1].end = Math.max(
        merged[merged.length - 1].end,
        range.end
      )
    }
  }

  // Find gaps within the day
  const dayStart = DAY_START_HOUR * 60
  const dayEnd = DAY_END_HOUR * 60
  const gaps: AvailableGap[] = []

  let cursor = dayStart
  for (const range of merged) {
    const clampedStart = Math.max(dayStart, range.start)
    if (cursor < clampedStart) {
      gaps.push({
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(clampedStart),
      })
    }
    cursor = Math.max(cursor, Math.min(dayEnd, range.end))
  }
  if (cursor < dayEnd) {
    gaps.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(dayEnd),
    })
  }

  // Filter out tiny gaps (less than 30 minutes)
  return gaps.filter((g) => {
    const duration = timeToMinutes(g.endTime) - timeToMinutes(g.startTime)
    return duration >= SLOT_MINUTES
  })
}

// ---------------------------------------------------------------------------
// ConflictDisplay (main export)
// ---------------------------------------------------------------------------

export function ConflictDisplay({
  conflicts,
  examDate,
  startTime,
  endTime,
  onSlotSelect,
  locale,
}: ConflictDisplayProps) {
  const { dictionary } = useDictionary()
  const tc = dictionary?.generate?.paper?.conflict
  const isRTL = locale === "ar"

  const timeSlots = useMemo(() => {
    const slots: { hour: number; minute: number; label: string }[] = []
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
      for (let m = 0; m < 60; m += SLOT_MINUTES) {
        slots.push({ hour: h, minute: m, label: formatTimeLabel(h, m, locale) })
      }
    }
    return slots
  }, [locale])

  const proposedRows = useMemo(
    () => timeRangeToGridRows(startTime, endTime),
    [startTime, endTime]
  )

  const conflictBlocks = useMemo(() => {
    return conflicts
      .map((c) => {
        const parts = c.conflictTime.split(" - ")
        if (parts.length !== 2) return null
        const cStart = parts[0].trim()
        const cEnd = parts[1].trim()
        // Only show if within the visible day range
        if (
          timeToMinutes(cEnd) <= DAY_START_HOUR * 60 ||
          timeToMinutes(cStart) >= DAY_END_HOUR * 60
        ) {
          return null
        }
        const rows = timeRangeToGridRows(cStart, cEnd)
        return { conflict: c, rows, startTime: cStart, endTime: cEnd }
      })
      .filter(Boolean) as {
      conflict: ConflictDetail
      rows: { rowStart: number; rowEnd: number }
      startTime: string
      endTime: string
    }[]
  }, [conflicts])

  const availableGaps = useMemo(
    () => computeAvailableGaps(conflicts, startTime, endTime),
    [conflicts, startTime, endTime]
  )

  const availableBlocks = useMemo(() => {
    return availableGaps.map((gap) => ({
      ...gap,
      rows: timeRangeToGridRows(gap.startTime, gap.endTime),
    }))
  }, [availableGaps])

  const dateLabel = useMemo(() => {
    return examDate.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [examDate, locale])

  return (
    <div className="space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Day view calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="size-4" />
            {dateLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div
            className="grid"
            style={{
              gridTemplateColumns: "auto 1fr",
              gridTemplateRows: `repeat(${TOTAL_SLOTS}, ${ROW_HEIGHT_PX}px)`,
            }}
          >
            {/* Time labels */}
            {timeSlots.map((slot, idx) => (
              <div
                key={`label-${slot.hour}-${slot.minute}`}
                className="text-muted-foreground flex items-start pe-3 text-xs"
                style={{
                  gridRow: idx + 1,
                  gridColumn: 1,
                }}
              >
                {slot.minute === 0 && (
                  <span className="leading-none">{slot.label}</span>
                )}
              </div>
            ))}

            {/* Grid lines */}
            {timeSlots.map((slot, idx) => (
              <div
                key={`grid-${slot.hour}-${slot.minute}`}
                className={`border-border/40 border-b ${
                  slot.minute === 0
                    ? "border-border"
                    : "border-border/20 border-dashed"
                }`}
                style={{
                  gridRow: idx + 1,
                  gridColumn: 2,
                }}
              />
            ))}

            {/* Available slots (green, clickable) */}
            {availableBlocks.map((block) => (
              <Tooltip key={`avail-${block.startTime}`}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="z-10 cursor-pointer rounded border border-green-300 bg-green-50 opacity-60 transition-opacity hover:opacity-100 dark:border-green-700 dark:bg-green-950/30"
                    style={{
                      gridRow: `${block.rows.rowStart} / ${block.rows.rowEnd}`,
                      gridColumn: 2,
                    }}
                    onClick={() =>
                      onSlotSelect?.(block.startTime, block.endTime)
                    }
                    aria-label={`${tc?.available || "Available"}: ${block.startTime} - ${block.endTime}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {tc?.available || "Available"}: {block.startTime} -{" "}
                    {block.endTime}
                  </p>
                  <p className="text-xs opacity-70">
                    {tc?.click_to_select || "Click to select this time"}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Proposed exam block (blue) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="z-20 rounded border-2 border-blue-500 bg-blue-100 dark:bg-blue-950/40"
                  style={{
                    gridRow: `${proposedRows.rowStart} / ${proposedRows.rowEnd}`,
                    gridColumn: 2,
                  }}
                >
                  <div className="flex h-full items-center px-2">
                    <span className="truncate text-xs font-medium text-blue-700 dark:text-blue-300">
                      {tc?.proposed_exam || "Proposed Exam"}
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">
                  {tc?.proposed_exam || "Proposed Exam"}
                </p>
                <p className="text-xs">
                  {startTime} - {endTime}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Conflict blocks (red) */}
            {conflictBlocks.map((block, idx) => {
              const Icon = CONFLICT_TYPE_ICONS[block.conflict.type]
              return (
                <Tooltip key={`conflict-${block.conflict.entityId}-${idx}`}>
                  <TooltipTrigger asChild>
                    <div
                      className="z-20 ms-8 rounded border-2 border-red-500 bg-red-100 dark:bg-red-950/40"
                      style={{
                        gridRow: `${block.rows.rowStart} / ${block.rows.rowEnd}`,
                        gridColumn: 2,
                      }}
                    >
                      <div className="flex h-full items-center gap-1.5 px-2">
                        <Icon className="size-3 shrink-0 text-red-600 dark:text-red-400" />
                        <span className="truncate text-xs font-medium text-red-700 dark:text-red-300">
                          {block.conflict.entityName}
                        </span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{block.conflict.entityName}</p>
                      <p className="text-xs">
                        {block.conflict.conflictingEvent}
                      </p>
                      <p className="text-xs opacity-70">
                        {block.startTime} - {block.endTime}
                      </p>
                      <SeverityBadge
                        severity={block.conflict.severity}
                        locale={locale}
                      />
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conflict list cards */}
      {conflicts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {(tc?.conflicts_detected || "{count} Conflict{s} Detected")
                .replace("{count}", String(conflicts.length))
                .replace("{s}", conflicts.length > 1 ? "s" : "")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {conflicts.map((conflict, idx) => (
              <ConflictCard
                key={`${conflict.entityId}-${idx}`}
                conflict={conflict}
                locale={locale}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ConflictCard
// ---------------------------------------------------------------------------

function ConflictCard({
  conflict,
  locale,
}: {
  conflict: ConflictDetail
  locale: "en" | "ar"
}) {
  const Icon = CONFLICT_TYPE_ICONS[conflict.type]

  const severityStyles: Record<ConflictDetail["severity"], string> = {
    high: "border-destructive/50 bg-destructive/5",
    medium: "border-amber-500/50 bg-amber-500/5",
    low: "border-blue-500/50 bg-blue-500/5",
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${severityStyles[conflict.severity]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{conflict.entityName}</span>
          <SeverityBadge severity={conflict.severity} locale={locale} />
          <Badge variant="outline" className="text-xs">
            {CONFLICT_TYPE_LABELS[conflict.type][locale]}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {conflict.conflictingEvent}
        </p>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <Clock className="size-3" />
          <span>{conflict.conflictTime}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SeverityBadge
// ---------------------------------------------------------------------------

function SeverityBadge({
  severity,
  locale,
}: {
  severity: ConflictDetail["severity"]
  locale: "en" | "ar"
}) {
  const label = severityLabel(severity, locale)

  switch (severity) {
    case "high":
      return <Badge variant="destructive">{label}</Badge>
    case "medium":
      return <Badge className={severityBadgeClassName("medium")}>{label}</Badge>
    case "low":
      return <Badge className={severityBadgeClassName("low")}>{label}</Badge>
  }
}
