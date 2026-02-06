"use client"

import { memo, useState } from "react"

import { cn } from "@/lib/utils"

import { SubjectSelector } from "./subject-selector"
import { TeacherInfoPopup } from "./teacher-info-popup"

// Subject color mapping for visual distinction (following reference pattern)
const SUBJECT_COLORS: Record<string, string> = {
  Math: "bg-purple-100 border-purple-300 dark:bg-purple-900/50 dark:border-purple-800",
  English:
    "bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-800",
  Science:
    "bg-pink-100 border-pink-300 dark:bg-pink-900/50 dark:border-pink-800",
  Arabic:
    "bg-blue-100 border-blue-300 dark:bg-blue-900/50 dark:border-blue-800",
  PE: "bg-orange-100 border-orange-300 dark:bg-orange-900/50 dark:border-orange-800",
  Music:
    "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/50 dark:border-yellow-800",
  Art: "bg-rose-100 border-rose-300 dark:bg-rose-900/50 dark:border-rose-800",
  History:
    "bg-amber-100 border-amber-300 dark:bg-amber-900/50 dark:border-amber-800",
  Geography:
    "bg-teal-100 border-teal-300 dark:bg-teal-900/50 dark:border-teal-800",
  Islamic:
    "bg-emerald-100 border-emerald-300 dark:bg-emerald-900/50 dark:border-emerald-800",
  Computer:
    "bg-cyan-100 border-cyan-300 dark:bg-cyan-900/50 dark:border-cyan-800",
  Physics:
    "bg-indigo-100 border-indigo-300 dark:bg-indigo-900/50 dark:border-indigo-800",
  Chemistry:
    "bg-violet-100 border-violet-300 dark:bg-violet-900/50 dark:border-violet-800",
  Biology:
    "bg-lime-100 border-lime-300 dark:bg-lime-900/50 dark:border-lime-800",
  Social: "bg-sky-100 border-sky-300 dark:bg-sky-900/50 dark:border-sky-800",
  Reading:
    "bg-indigo-100 border-indigo-300 dark:bg-indigo-900/50 dark:border-indigo-800",
  Korean:
    "bg-violet-100 border-violet-300 dark:bg-violet-900/50 dark:border-violet-800",
  Chinese: "bg-red-100 border-red-300 dark:bg-red-900/50 dark:border-red-800",
  Sports:
    "bg-teal-100 border-teal-300 dark:bg-teal-900/50 dark:border-teal-800",
  Club: "bg-cyan-100 border-cyan-300 dark:bg-cyan-900/50 dark:border-cyan-800",
}

// Fallback colors for unknown subjects
const FALLBACK_COLORS = [
  "bg-red-100 border-red-300 dark:bg-red-900/50 dark:border-red-800",
  "bg-orange-100 border-orange-300 dark:bg-orange-900/50 dark:border-orange-800",
  "bg-yellow-100 border-yellow-300 dark:bg-yellow-900/50 dark:border-yellow-800",
  "bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-800",
  "bg-blue-100 border-blue-300 dark:bg-blue-900/50 dark:border-blue-800",
]

function getSubjectColor(subject: string): string {
  if (!subject) return "bg-muted border-border"

  // Check direct mapping first
  if (SUBJECT_COLORS[subject]) {
    return SUBJECT_COLORS[subject]
  }

  // Check partial matches
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) {
      return color
    }
  }

  // Fallback based on hash
  const hash = subject
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]
}

interface TimetableCellProps {
  subject: string
  index: number
  periodIdx: number
  timetableData: any
  onTeacherInfoSave: (subject: string, info: string) => void
  getTeacherInfo: (subject: string) => string | undefined
  onSubjectChange?: (
    dayIndex: number,
    periodIdx: number,
    newSubject: string
  ) => void
  showAllSubjects?: boolean
  availableSubjects?: string[]
  isLastColumn?: boolean
}

function TimetableCellComponent({
  subject,
  index,
  periodIdx,
  timetableData,
  onTeacherInfoSave,
  getTeacherInfo,
  onSubjectChange,
  showAllSubjects = false,
  availableSubjects = [],
  isLastColumn = false,
}: TimetableCellProps) {
  const [showSubjectSelector, setShowSubjectSelector] = useState(false)
  const info = getTeacherInfo(subject)
  const isEmpty = subject === ""
  const periodData = timetableData?.timetable?.[index]?.[periodIdx]
  const isReplaced = periodData?.replaced
  const originalSubject = periodData?.original?.subject

  const handleSubjectChange = (newSubject: string) => {
    if (onSubjectChange) {
      onSubjectChange(index, periodIdx, newSubject)
    }
  }

  const handleDoubleClick = () => {
    if (onSubjectChange) {
      setShowSubjectSelector(true)
    }
  }

  // Empty cell
  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex items-center justify-center px-8 py-5 transition-all duration-200",
          "bg-muted/20",
          !isLastColumn && "border-border border-e",
          onSubjectChange && "hover:bg-muted/40 cursor-pointer",
          "print:py-4"
        )}
        onDoubleClick={handleDoubleClick}
        title={onSubjectChange ? "Double-click to add subject" : ""}
      >
        <span className="text-muted-foreground/50">-</span>
      </div>
    )
  }

  // Subject cell
  return (
    <>
      <div
        className={cn(
          "flex flex-col items-center justify-center px-8 py-5 transition-all duration-200",
          getSubjectColor(subject),
          !isLastColumn && "border-border border-e",
          "cursor-pointer hover:shadow-inner",
          "print:py-4"
        )}
        onDoubleClick={handleDoubleClick}
        title={
          onSubjectChange
            ? "Double-click to edit subject"
            : "Click for teacher info"
        }
      >
        <TeacherInfoPopup
          subject={subject}
          onSave={(info) => onTeacherInfoSave(subject, info)}
          initialInfo={info}
        >
          <div className="flex w-full flex-col items-center justify-center">
            <span
              className={cn(
                "text-center font-medium print:text-base print:font-semibold",
                isReplaced ? "text-destructive" : "text-foreground"
              )}
            >
              {subject}
            </span>

            {isReplaced && originalSubject && (
              <span className="text-destructive mt-0.5 text-xs">
                (was: {originalSubject})
              </span>
            )}

            {info && (
              <span className="text-muted-foreground mt-1 text-xs print:text-sm">
                {info.length > 8 ? `${info.slice(0, 8)}...` : info}
              </span>
            )}
          </div>
        </TeacherInfoPopup>
      </div>

      {onSubjectChange && (
        <SubjectSelector
          open={showSubjectSelector}
          onOpenChange={setShowSubjectSelector}
          currentSubject={subject}
          onSubjectChange={handleSubjectChange}
          showAllSubjects={showAllSubjects}
          availableSubjects={availableSubjects}
        />
      )}
    </>
  )
}

// Memoized export to prevent unnecessary re-renders
export const TimetableCell = memo(
  TimetableCellComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.subject === nextProps.subject &&
      prevProps.index === nextProps.index &&
      prevProps.periodIdx === nextProps.periodIdx &&
      prevProps.showAllSubjects === nextProps.showAllSubjects &&
      prevProps.isLastColumn === nextProps.isLastColumn &&
      JSON.stringify(prevProps.availableSubjects) ===
        JSON.stringify(nextProps.availableSubjects) &&
      JSON.stringify(
        prevProps.timetableData?.timetable?.[prevProps.index]?.[
          prevProps.periodIdx
        ]
      ) ===
        JSON.stringify(
          nextProps.timetableData?.timetable?.[nextProps.index]?.[
            nextProps.periodIdx
          ]
        ) &&
      prevProps.onTeacherInfoSave === nextProps.onTeacherInfoSave &&
      prevProps.getTeacherInfo === nextProps.getTeacherInfo &&
      prevProps.onSubjectChange === nextProps.onSubjectChange
    )
  }
)
