"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo, useState } from "react"

import { cn } from "@/lib/utils"

import { getSubjectTailwind } from "./config"
import { SubjectSelector } from "./subject-selector"
import { TeacherInfoPopup } from "./teacher-info-popup"

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
          getSubjectTailwind(subject),
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
