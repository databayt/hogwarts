'use client'

import { memo } from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { TimetableCell } from "./timetable-cell"
import type { LegacyTimetableData } from "./types"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface TimetableGridProps {
  periods: Array<{
    id: string
    time: string
    subjects: string[]
  }>
  timetableData: LegacyTimetableData | null
  onTeacherInfoSave: (subject: string, info: string) => void
  getTeacherInfo: (subject: string) => string | undefined
  onSubjectChange?: (dayIndex: number, periodIdx: number, newSubject: string) => void
  showAllSubjects?: boolean
  availableSubjects?: string[]
}

function TimetableGridComponent({
  periods,
  timetableData,
  onTeacherInfoSave,
  getTeacherInfo,
  onSubjectChange,
  showAllSubjects = false,
  availableSubjects = []
}: TimetableGridProps) {
  const days: number[] | undefined = timetableData?.days
  const labels = days && days.length > 0
    ? days.map((d: number) => DAY_LABELS[d] ?? String(d))
    : DAY_LABELS.slice(1, 6) // Default Mon-Fri

  const totalCols = (labels?.length ?? 5) + 1

  const gridColsClass = (() => {
    switch (totalCols) {
      case 2: return 'grid-cols-2'
      case 3: return 'grid-cols-3'
      case 4: return 'grid-cols-4'
      case 5: return 'grid-cols-5'
      case 6: return 'grid-cols-6'
      case 7: return 'grid-cols-7'
      case 8: return 'grid-cols-8'
      default: return 'grid-cols-6'
    }
  })()

  const lunchColSpan = (() => {
    const span = (labels?.length ?? 5)
    switch (span) {
      case 1: return 'col-span-1'
      case 2: return 'col-span-2'
      case 3: return 'col-span-3'
      case 4: return 'col-span-4'
      case 5: return 'col-span-5'
      case 6: return 'col-span-6'
      case 7: return 'col-span-7'
      default: return 'col-span-5'
    }
  })()

  return (
    <div className="overflow-x-auto rounded-xl shadow-lg border border-border">
      <div className="min-w-full bg-card">
        {/* Header */}
        <div className={cn("grid bg-muted/50 border-b border-border", gridColsClass)}>
          <div className="py-5 px-8 text-muted-foreground flex items-center justify-center border-r border-border print:py-3">
            <Clock className="w-4 h-4 mr-2 print:w-5 print:h-5" />
            <span className="font-medium">Period</span>
          </div>
          {labels.map((day, index) => (
            <div
              key={day}
              className={cn(
                "py-5 px-8 font-medium text-center text-foreground",
                index < labels.length - 1 ? "border-r border-border" : "",
                "print:text-base print:font-semibold print:py-3"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="divide-y divide-border">
          {periods.map((period) => (
            <div key={period.id} className={cn("grid", gridColsClass)}>
              {/* Period Cell */}
              <div className="py-5 px-8 bg-muted/50 flex flex-col justify-center items-center border-r border-border print:py-4">
                <span className="font-medium text-foreground print:text-base print:font-semibold">
                  {period.id === "Lunch" ? "Lunch" : `Period ${period.id}`}
                </span>
                {period.id !== "Lunch" && (
                  <span className="text-xs text-muted-foreground mt-1 print:text-sm">
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
                    "py-5 px-8 bg-muted/30 flex items-center justify-center print:py-4",
                    lunchColSpan
                  )}
                >
                  <span className="font-medium text-muted-foreground print:text-base print:font-semibold">
                    Lunch Break
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
export const TimetableGrid = memo(TimetableGridComponent, (prevProps, nextProps) => {
  return (
    prevProps.periods.length === nextProps.periods.length &&
    JSON.stringify(prevProps.periods) === JSON.stringify(nextProps.periods) &&
    JSON.stringify(prevProps.timetableData) === JSON.stringify(nextProps.timetableData) &&
    prevProps.showAllSubjects === nextProps.showAllSubjects &&
    JSON.stringify(prevProps.availableSubjects) === JSON.stringify(nextProps.availableSubjects) &&
    prevProps.onTeacherInfoSave === nextProps.onTeacherInfoSave &&
    prevProps.getTeacherInfo === nextProps.getTeacherInfo &&
    prevProps.onSubjectChange === nextProps.onSubjectChange
  )
})
