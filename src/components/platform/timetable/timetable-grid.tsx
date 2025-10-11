'use client'

import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { TimetableCell } from "./timetable-cell"
import type { LegacyTimetableData } from "./types"

const DAY_LABELS = ["Sun","Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

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

export function TimetableGrid({
  periods,
  timetableData,
  onTeacherInfoSave,
  getTeacherInfo,
  onSubjectChange,
  showAllSubjects = false,
  availableSubjects = []
}: TimetableGridProps) {
  const days: number[] | undefined = timetableData?.days
  const labels = days && days.length > 0 ? days.map((d: number) => DAY_LABELS[d] ?? String(d)) : DAY_LABELS.slice(0,5)
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
    <div className="min-w-full">
      {/* Header */}
      <div className={cn('grid bg-muted border-neutral-200 dark:border-neutral-700', gridColsClass)}>
        <div className="py-3 px-2 text-neutral-500 dark:text-neutral-400 flex flex-col items-center justify-center border-r border-neutral-200 dark:border-neutral-700 print:py-3">
          <Clock className="w-4 h-4 print:w-5 print:h-5" />
        </div>
        {labels.map((day, index) => (
          <div
            key={day}
            className={cn(
              "py-2 px-4 text-center text-neutral-700 dark:text-neutral-300",
              index < labels.length - 1 ? "border-r border-neutral-200 dark:border-neutral-700" : "",
              "print:text-base print:font-semibold print:py-3"
            )}
          >
            <h6 className="sm:text-base">{day}</h6>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="divide-neutral-200 dark:divide-neutral-700">
        {periods.map((period) => (
          <div key={period.id} className={cn('grid avoid-break', gridColsClass)}>
            <div className="py-3 sm:py-5 bg-muted flex flex-col justify-center items-center border-t border-r border-neutral-200 dark:border-neutral-700 print:py-4">
              <h6 className="sm:text-base text-neutral-700 dark:text-neutral-300 print:text-base print:font-semibold">
                {period.id === "Lunch" ? "Lunch" : `Period ${period.id}`}
              </h6>
              {period.id !== "Lunch" ? (
                <p className="muted print:text-sm">
                  <small className="sm:text-sm">({period.time})</small>
                </p>
              ) : null}
            </div>

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
                  />
                )
              })
            ) : (
              <div className={cn("bg-neutral-100 dark:bg-neutral-800 print:py-4 flex items-center justify-center border-t border-neutral-200 dark:border-neutral-700", lunchColSpan)}>
                <h6 className="text-neutral-700 dark:text-neutral-300 print:text-base print:font-semibold">
                  Lunch
                </h6>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 