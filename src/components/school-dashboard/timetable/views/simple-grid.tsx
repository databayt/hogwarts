"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"

import {
  DAY_LABELS_AR,
  DAY_LABELS_EN,
  EMPTY_CELL_STYLE,
  getSubjectTailwind,
} from "../config"

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
  lunchAfterPeriod?: number | null
  isRTL?: boolean
  viewMode?: "class" | "teacher" | "room"
  editable?: boolean
  onSlotClick?: (day: number, periodId: string, slot?: Slot) => void
  /** Highlight the current day column */
  highlightToday?: boolean
  /** Set of slot IDs that have conflicts (shown with red ring) */
  conflictSlotIds?: Set<string>
  dictionary?: {
    period?: string
    lunch?: string
    lunchBreak?: string
    days?: string[]
  }
}

export default function SimpleGrid({
  slots,
  workingDays,
  periods,
  lunchAfterPeriod,
  isRTL = false,
  viewMode = "class",
  editable = false,
  onSlotClick,
  highlightToday = false,
  conflictSlotIds,
  dictionary,
}: SimpleGridProps) {
  // Get current day for highlighting
  const today = highlightToday ? new Date().getDay() : -1

  // Compute lunch time from periods
  const lunchTime = useMemo(() => {
    const breakPeriod = periods.find(
      (p) => p.isBreak && p.name.toLowerCase().includes("lunch")
    )
    if (!breakPeriod) return ""
    const d = new Date(breakPeriod.startTime)
    return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`
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
    switch (viewMode) {
      case "teacher":
        return {
          primary: slot.className || slot.subject || "",
          secondary: slot.room || "",
        }
      case "room":
        return {
          primary: slot.subject || slot.className || "",
          secondary: slot.teacher || "",
        }
      case "class":
      default:
        return {
          primary: slot.subject || "",
          secondary: slot.teacher || "",
        }
    }
  }

  // Sort working days for RTL
  const sortedDays = isRTL ? [...workingDays].reverse() : workingDays

  // Filter periods (teaching only, no breaks)
  const teachingPeriods = periods.filter((p) => !p.isBreak)

  // Calculate grid columns class
  const totalCols = sortedDays.length + 1
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
      <div className="min-w-full bg-white dark:bg-neutral-900">
        {/* Header */}
        <div
          className={cn(
            "grid border-b border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800",
            gridColsClass
          )}
        >
          <div className="flex flex-col items-center justify-center border-e border-neutral-200 px-2 py-3 text-neutral-500 sm:px-8 sm:py-5 dark:border-neutral-700 dark:text-neutral-400 print:py-3">
            <Clock className="h-4 w-4 print:h-5 print:w-5" />
          </div>
          {sortedDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                "px-4 py-2 text-center text-sm font-medium text-neutral-700 sm:px-8 sm:py-5 sm:text-base dark:text-neutral-300",
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
          {teachingPeriods.map((period, periodIdx) => (
            <div key={period.id}>
              {/* Lunch Row (inserted after specified period) */}
              {lunchAfterPeriod && periodIdx + 1 === lunchAfterPeriod && (
                <div className={cn("grid", gridColsClass)}>
                  <div className="flex flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 py-3 sm:px-8 sm:py-5 dark:border-neutral-700 dark:bg-neutral-800">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {dictionary?.lunch ?? "Lunch"}
                    </span>
                    {lunchTime && (
                      <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        ({lunchTime})
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-center bg-neutral-50 px-2 py-3 sm:px-8 sm:py-5 dark:bg-neutral-800/50",
                      lunchColSpan
                    )}
                  >
                    <span className="font-medium text-neutral-500 dark:text-neutral-400">
                      {dictionary?.lunchBreak ?? "Lunch Break"}
                    </span>
                  </div>
                </div>
              )}

              {/* Regular Period Row */}
              <div className={cn("grid", gridColsClass)}>
                {/* Period Cell */}
                <div className="flex flex-col items-center justify-center border-e border-neutral-200 bg-neutral-100 px-2 py-3 sm:px-8 sm:py-5 dark:border-neutral-700 dark:bg-neutral-800 print:py-3">
                  <span className="text-sm font-medium text-neutral-700 sm:text-base dark:text-neutral-300 print:text-sm">
                    {(dictionary?.period ?? "Period") + " "}
                    {period.name}
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

                  return (
                    <div
                      key={`${day}-${period.id}`}
                      className={cn(
                        "flex min-h-14 flex-col items-center justify-center px-2 py-2 transition-all duration-200 sm:min-h-20 sm:px-4 sm:py-4",
                        slot && display?.primary
                          ? getSubjectTailwind(display.primary)
                          : EMPTY_CELL_STYLE,
                        dayIdx < sortedDays.length - 1
                          ? "border-e border-neutral-200 dark:border-neutral-700"
                          : "",
                        day === today && "bg-primary/5",
                        editable && "cursor-pointer hover:shadow-inner",
                        isConflicted && "ring-2 ring-red-500",
                        "print:min-h-12 print:py-2"
                      )}
                      onClick={() =>
                        editable && onSlotClick?.(day, period.id, slot)
                      }
                    >
                      {slot && display ? (
                        <>
                          <span className="text-center text-xs font-medium text-neutral-800 sm:text-sm dark:text-neutral-100 print:text-xs">
                            {display.primary}
                          </span>
                          {display.secondary && (
                            <span className="mt-0.5 text-xs text-neutral-600 sm:mt-1 dark:text-neutral-400 print:text-[10px]">
                              {display.secondary}
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
