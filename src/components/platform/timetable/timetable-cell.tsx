'use client'

import { useState } from "react"
import { cn } from "@/lib/utils"
import { TeacherInfoPopup } from "./teacher-info-popup"
import { SubjectSelector } from "./subject-selector"
import { getSubjectCategoryColor } from "@/components/profile/subject-colors"

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
        <h6 className="h-14 xs:h-18 sm:h-23 text-neutral-800 dark:text-neutral-200 text-center print:text-base print:font-semibold">
          {subject}
        </h6>
      </div>
    )
  }

  return (
    <>
      <div className={cn(
        "py-1 px-2 flex flex-col items-center justify-center transition-all duration-200 border-t border-neutral-200 dark:border-neutral-700",
        index < 4 ? 'border-r' : '',
        getSubjectCategoryColor(subject, true),
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
            <h6 className={cn(
              "xs:text-base sm:text-lg text-center print:text-lg print:font-semibold xs:line-clamp-1 print:text-black",
              isReplaced
                ? "text-red-600 dark:text-red-400"
                : "text-neutral-800 dark:text-neutral-200"
            )}>
              {subject}
            </h6>

            {isReplaced && originalSubject && (
              <p className="text-red-500 dark:text-red-400 -mt-1 line-clamp-1">
                <small>(Replaced: {originalSubject})</small>
              </p>
            )}

            {info && (
              <p className="text-neutral-600 dark:text-neutral-400 print:text-base print:mt-0 line-clamp-1">
                <small className="xs:text-sm sm:text-base">
                  {info.length > 4 ? `${info.slice(0, 4)}...` : info}
                </small>
              </p>
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