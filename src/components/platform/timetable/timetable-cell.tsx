'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { TeacherInfoPopup } from "./teacher-info-popup"
import { SubjectSelector } from "./subject-selector"

const COLORS = [
  'bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70',
  'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/50 dark:hover:bg-orange-900/70',
  'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70', 
  'bg-green-100 hover:bg-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/70',
  'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70'
]

function getSubjectColor(subject: string) {
  return COLORS[subject.charCodeAt(0) % COLORS.length];
}

interface TimetableCellProps {
  subject: string
  index: number
  periodIdx: number
  timetableData: any // Replace with proper type
  onTeacherInfoSave: (subject: string, info: string) => void
  getTeacherInfo: (subject: string) => string | undefined
  onSubjectChange?: (dayIndex: number, periodIdx: number, newSubject: string) => void
  showAllSubjects?: boolean
  availableSubjects?: string[]
}

export function TimetableCell({
  subject,
  index,
  periodIdx,
  timetableData,
  onTeacherInfoSave,
  getTeacherInfo,
  onSubjectChange,
  showAllSubjects = false,
  availableSubjects = []
}: TimetableCellProps) {
  const [showSubjectSelector, setShowSubjectSelector] = useState(false)
  const info = getTeacherInfo(subject)
  const isEmpty = subject === ""
  const periodData = timetableData?.timetable[index]?.[periodIdx]
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

  if (isEmpty) {
    return (
      <div className={cn(
        "py-1 px-2 flex flex-col items-center justify-center transition-all duration-200 border-t border-neutral-200 dark:border-neutral-700",
        index < 4 ? 'border-r' : '',
        "bg-neutral-50 dark:bg-neutral-800",
        "print:hover:bg-white print:py-4",
        onSubjectChange ? "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700" : ""
      )}
      onDoubleClick={handleDoubleClick}
      title={onSubjectChange ? "Double-click to edit subject" : ""}
      >
        <span className="h-14 xs:h-18 sm:h-23 font-medium text-neutral-800 dark:text-neutral-200 text-center print:text-base print:font-semibold">
          {subject}
        </span>
      </div>
    )
  }

  return (
    <>
      <div className={cn(
        "py-1 px-2 flex flex-col items-center justify-center transition-all duration-200 border-t border-neutral-200 dark:border-neutral-700",
        index < 4 ? 'border-r' : '',
        getSubjectColor(subject),
        "cursor-pointer",
        "print:hover:bg-white print:py-4",
        onSubjectChange ? "hover:opacity-80" : ""
      )}
      onDoubleClick={handleDoubleClick}
      title={onSubjectChange ? "Double-click to edit subject" : "Click to edit teacher info"}
      >
        <TeacherInfoPopup
          subject={subject}
          onSave={(info) => onTeacherInfoSave(subject, info)}
          initialInfo={info}
        >
          <div className="w-full h-14 xs:h-18 sm:h-23 flex flex-col items-center justify-center overflow-hidden">
            <span className={cn(
              "font-semibold text-sm xs:text-base sm:text-lg text-center print:text-lg print:font-semibold xs:line-clamp-1 print:text-black",
              isReplaced 
                ? "text-red-600 dark:text-red-400" 
                : "text-neutral-800 dark:text-neutral-200"
            )}>
              {subject}
            </span>
      
            {isReplaced && originalSubject && (
              <span className="text-xs text-red-500 dark:text-red-400 -mt-1 line-clamp-1">
                (Replaced: {originalSubject})
              </span>
            )}

            {info && (
              <span className="text-xs xs:text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium print:text-base print:mt-0 line-clamp-1">
                {info.length > 4 ? `${info.slice(0, 4)}...` : info}
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