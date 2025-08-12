'use client'

import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { TimetableCell } from "./timetable-cell"

const DAYS = ["Sun","Mon", "Tue", "Wed", "Thu"]

interface TimetableGridProps {
  periods: Array<{
    id: string
    time: string
    subjects: string[]
  }>
  timetableData: any // Replace with proper type
  onTeacherInfoSave: (subject: string, info: string) => void
  getTeacherInfo: (subject: string) => string | undefined
}

export function TimetableGrid({
  periods,
  timetableData,
  onTeacherInfoSave,
  getTeacherInfo,
}: TimetableGridProps) {
  return (
    <div className="min-w-full">
      {/* Header */}
      <div className="grid grid-cols-6 bg-muted border-neutral-200 dark:border-neutral-700">
        <div className="py-3 px-2 font-medium text-neutral-500 dark:text-neutral-400 flex flex-col items-center justify-center border-r border-neutral-200 dark:border-neutral-700 print:py-3">
          <Clock className="w-4 h-4 print:w-5 print:h-5" />
        </div>
        {DAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              "text-sm sm:text-base py-2 px-4 font-medium text-center text-neutral-700 dark:text-neutral-300",
              index < DAYS.length - 1 ? "border-r border-neutral-200 dark:border-neutral-700" : "",
              "print:text-base print:font-semibold print:py-3"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="divide-neutral-200 dark:divide-neutral-700">
        {periods.map((period) => (
          <div key={period.id} className="grid grid-cols-6">
            <div className="py-3 sm:py-5 bg-muted flex flex-col justify-center items-center border-t border-r border-neutral-200 dark:border-neutral-700 print:py-4">
              <span className="text-sm sm:text-base font-medium text-neutral-700 dark:text-neutral-300 print:text-base print:font-semibold">
                {period.id === "Lunch" ? "Lunch" : `Period ${period.id}`}
              </span>
              {period.id !== "Lunch" ? (
                <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 print:text-sm">
                  ({period.time})
                </span>
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
                  />
                )
              })
            ) : (
              <div className="col-span-5 bg-neutral-100 dark:bg-neutral-800 print:py-4 flex items-center justify-center border-t border-neutral-200 dark:border-neutral-700">
                <span className="font-medium text-neutral-700 dark:text-neutral-300 print:text-base print:font-semibold">
                  Lunch
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 