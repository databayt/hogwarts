"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo } from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { TimetableCell } from "./timetable-cell"
import type { LegacyTimetableData } from "./types"

interface TimetableGridProps {
  periods: Array<{
    id: string
    time: string
    subjects: string[]
  }>
  timetableData: LegacyTimetableData | null
  onTeacherInfoSave: (subject: string, info: string) => void
  getTeacherInfo: (subject: string) => string | undefined
  onSubjectChange?: (
    dayIndex: number,
    periodIdx: number,
    newSubject: string
  ) => void
  showAllSubjects?: boolean
  availableSubjects?: string[]
}

const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function TimetableGridComponent({
  periods,
  timetableData,
  onTeacherInfoSave,
  getTeacherInfo,
  onSubjectChange,
  showAllSubjects = false,
  availableSubjects = [],
}: TimetableGridProps) {
  const { dictionary } = useDictionary()
  const dt = dictionary?.school?.timetable as Record<string, any> | undefined
  const g = dt?.grid
  const dayLabels: string[] = (dt?.days as string[]) ?? DAY_LABELS_EN

  const days: number[] | undefined = timetableData?.days
  const labels =
    days && days.length > 0
      ? days.map((d: number) => dayLabels[d] ?? String(d))
      : dayLabels.slice(1, 6) // Default Mon-Fri

  const totalCols = (labels?.length ?? 5) + 1

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

  const lunchColSpan = (() => {
    const span = labels?.length ?? 5
    switch (span) {
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
    <div className="border-border overflow-x-auto rounded-xl border shadow-lg">
      <div className="bg-card min-w-full">
        {/* Header */}
        <div
          className={cn(
            "bg-muted/50 border-border grid border-b",
            gridColsClass
          )}
        >
          <div className="text-muted-foreground border-border flex items-center justify-center border-e px-8 py-5 print:py-3">
            <Clock className="me-2 h-4 w-4 print:h-5 print:w-5" />
            <span className="font-medium">{g?.period ?? "Period"}</span>
          </div>
          {labels.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-foreground px-8 py-5 text-center font-medium",
                index < labels.length - 1 ? "border-border border-e" : "",
                "print:py-3 print:text-base print:font-semibold"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="divide-border divide-y">
          {periods.map((period) => (
            <div key={period.id} className={cn("grid", gridColsClass)}>
              {/* Period Cell */}
              <div className="bg-muted/50 border-border flex flex-col items-center justify-center border-e px-8 py-5 print:py-4">
                <span className="text-foreground font-medium print:text-base print:font-semibold">
                  {period.id === "Lunch"
                    ? (g?.lunchPeriod ?? "Lunch")
                    : `${g?.period ?? "Period"} ${period.id}`}
                </span>
                {period.id !== "Lunch" && (
                  <span className="text-muted-foreground mt-1 text-xs print:text-sm">
                    ({period.time})
                  </span>
                )}
              </div>

              {/* Subject Cells */}
              {period.id !== "Lunch" ? (
                period.subjects.map((subject, index) => {
                  const periodIdx = parseInt(period.id) - 1
                  return (
                    <TimetableCell
                      key={index}
                      subject={subject}
                      index={index}
                      periodIdx={periodIdx}
                      timetableData={timetableData}
                      onTeacherInfoSave={onTeacherInfoSave}
                      getTeacherInfo={getTeacherInfo}
                      onSubjectChange={onSubjectChange}
                      showAllSubjects={showAllSubjects}
                      availableSubjects={availableSubjects}
                      isLastColumn={index === labels.length - 1}
                    />
                  )
                })
              ) : (
                <div
                  className={cn(
                    "bg-muted/30 flex items-center justify-center px-8 py-5 print:py-4",
                    lunchColSpan
                  )}
                >
                  <span className="text-muted-foreground font-medium print:text-base print:font-semibold">
                    {g?.lunchBreak ?? "Lunch Break"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Memoized export to prevent unnecessary re-renders
export const TimetableGrid = memo(
  TimetableGridComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.periods.length === nextProps.periods.length &&
      JSON.stringify(prevProps.periods) === JSON.stringify(nextProps.periods) &&
      JSON.stringify(prevProps.timetableData) ===
        JSON.stringify(nextProps.timetableData) &&
      prevProps.showAllSubjects === nextProps.showAllSubjects &&
      JSON.stringify(prevProps.availableSubjects) ===
        JSON.stringify(nextProps.availableSubjects) &&
      prevProps.onTeacherInfoSave === nextProps.onTeacherInfoSave &&
      prevProps.getTeacherInfo === nextProps.getTeacherInfo &&
      prevProps.onSubjectChange === nextProps.onSubjectChange
    )
  }
)
