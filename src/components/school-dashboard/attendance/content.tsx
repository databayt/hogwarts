"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { Clock, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  getAttendanceList,
  getAttendanceReportCsv,
  getCurrentPeriod,
  getSectionsForSelection,
  markAttendance,
} from "@/components/school-dashboard/attendance/actions"

import { getAttendanceColumns } from "./columns"
import {
  AttendanceEmptyState,
  NoClassesEmptyState,
  NoStudentsEmptyState,
} from "./empty-state"
import { AttendanceErrorBoundary } from "./error-boundary"
import { AttendanceTableSkeleton } from "./loading-skeleton"
import { AttendanceTable, type AttendanceRow } from "./table"

interface Props {
  dictionary?: Dictionary["school"]
  lang?: string
}

export function AttendanceContent({ dictionary, lang }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [sectionId, setSectionId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [sections, setSections] = useState<
    Array<{
      id: string
      name: string
      gradeName: string
      gradeId: string
      teacher: string | null
      studentCount: number
    }>
  >([])
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sectionsLoading, setSectionsLoading] = useState(true)

  // Smart section selection from timetable
  const [currentPeriodInfo, setCurrentPeriodInfo] = useState<{
    sectionId: string | null
    periodName: string | null
    name: string | null
    isAutoSelected: boolean
  }>({
    sectionId: null,
    periodName: null,
    name: null,
    isAutoSelected: false,
  })

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      if (!sectionId) {
        setRows([])
        return
      }
      const result = await getAttendanceList({ sectionId, date, lang })
      if (result.success && result.data) {
        setRows(result.data.rows)
      }
    } finally {
      setIsLoading(false)
    }
  }, [sectionId, date, lang])

  useEffect(() => {
    void load()
  }, [load])

  // Load sections and auto-select based on current timetable period
  useEffect(() => {
    ;(async () => {
      try {
        const [sectionsRes, periodRes] = await Promise.all([
          getSectionsForSelection(),
          getCurrentPeriod(),
        ])

        if (!sectionsRes.success || !sectionsRes.data) return
        setSections(sectionsRes.data.sections)

        // Smart selection: Use current period's section if available
        if (
          periodRes.success &&
          periodRes.data?.currentPeriod?.sectionId &&
          sectionsRes.data.sections.some(
            (s) => s.id === periodRes.data?.currentPeriod?.sectionId
          )
        ) {
          setSectionId(periodRes.data.currentPeriod.sectionId)
          setCurrentPeriodInfo({
            sectionId: periodRes.data.currentPeriod.sectionId,
            periodName: periodRes.data.currentPeriod.periodName,
            name: periodRes.data.currentPeriod.name,
            isAutoSelected: true,
          })
        } else if (!sectionId && sectionsRes.data.sections[0]) {
          // Fallback to first section if no current period
          setSectionId(sectionsRes.data.sections[0].id)
        }
      } finally {
        setSectionsLoading(false)
      }
    })()
  }, [])
  const [changed, setChanged] = useState<
    Record<string, AttendanceRow["status"]>
  >({})
  const onSubmit = async () => {
    setSubmitting(true)
    try {
      const records = Object.entries(changed).map(([studentId, status]) => ({
        studentId,
        status,
      }))
      await markAttendance({
        sectionId,
        date: new Date(date).toISOString(),
        records,
      })
      setChanged({})
      await load()
      SuccessToast(
        dictionary?.attendance?.attendanceSaved ||
          "Attendance saved successfully"
      )
    } catch (e) {
      ErrorToast(
        e instanceof Error
          ? e.message
          : dictionary?.attendance?.failed || "Failed"
      )
    } finally {
      setSubmitting(false)
    }
  }
  const onChangeStatus = (
    studentId: string,
    status: AttendanceRow["status"]
  ) => {
    setChanged((prev) => ({ ...prev, [studentId]: status }))
    setRows((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    )
  }
  // Get dictionary with fallbacks
  const dict = dictionary?.attendance || {
    title: "Attendance",
    selectClass: "Select class",
    allPresent: "All Present",
    allAbsent: "All Absent",
    allLate: "All Late",
    saveAttendance: "Save Attendance",
    status: {
      present: "Present",
      absent: "Absent",
      late: "Late",
      excused: "Excused",
    },
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Skip keyboard shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      if (e.key.toLowerCase() === "p") {
        setRows((r) => r.map((x) => ({ ...x, status: "present" })))
        setChanged(() => {
          const next: Record<string, AttendanceRow["status"]> = {}
          rows.forEach((r) => {
            next[r.studentId] = "present"
          })
          return next
        })
      }
      if (e.key.toLowerCase() === "a") {
        setRows((r) => r.map((x) => ({ ...x, status: "absent" })))
        setChanged(() => {
          const next: Record<string, AttendanceRow["status"]> = {}
          rows.forEach((r) => {
            next[r.studentId] = "absent"
          })
          return next
        })
      }
      if (e.key.toLowerCase() === "l") {
        setRows((r) => r.map((x) => ({ ...x, status: "late" })))
        setChanged(() => {
          const next: Record<string, AttendanceRow["status"]> = {}
          rows.forEach((r) => {
            next[r.studentId] = "late"
          })
          return next
        })
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void onSubmit()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onSubmit, rows])
  return (
    <AttendanceErrorBoundary>
      {isLoading || sectionsLoading ? (
        <AttendanceTableSkeleton rows={10} />
      ) : sections.length === 0 ? (
        <NoClassesEmptyState
          dictionary={dictionary?.attendance}
          locale={lang}
        />
      ) : (
        <div className="space-y-3">
          <div
            role="toolbar"
            aria-orientation="horizontal"
            className="flex w-full flex-wrap items-center gap-2 p-1"
          >
            <Select
              value={sectionId}
              onValueChange={(val) => {
                setSectionId(val)
                // Clear auto-selected flag when user manually changes
                if (val !== currentPeriodInfo.sectionId) {
                  setCurrentPeriodInfo((prev) => ({
                    ...prev,
                    isAutoSelected: false,
                  }))
                }
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="h-9 w-56">
                <SelectValue placeholder={dict.selectClass} />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      {s.name}
                      {s.id === currentPeriodInfo.sectionId && (
                        <Clock className="h-3 w-3 text-blue-500" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Smart selection indicator */}
            {currentPeriodInfo.isAutoSelected &&
              sectionId === currentPeriodInfo.sectionId && (
                <Badge
                  variant="secondary"
                  className="flex h-6 items-center gap-1 bg-blue-100 text-xs text-blue-700"
                >
                  <Sparkles className="h-3 w-3" />
                  {currentPeriodInfo.periodName}
                  {currentPeriodInfo.name && ` • ${currentPeriodInfo.name}`}
                </Badge>
              )}
            <Input
              type="date"
              className="h-9 w-44"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setRows((r) => r.map((x) => ({ ...x, status: "present" })))
                  setChanged(() => {
                    const next: Record<string, AttendanceRow["status"]> = {}
                    rows.forEach((r) => {
                      next[r.studentId] = "present"
                    })
                    return next
                  })
                }}
                disabled={isLoading || rows.length === 0}
              >
                {dict.allPresent || "All Present"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setRows((r) => r.map((x) => ({ ...x, status: "absent" })))
                  setChanged(() => {
                    const next: Record<string, AttendanceRow["status"]> = {}
                    rows.forEach((r) => {
                      next[r.studentId] = "absent"
                    })
                    return next
                  })
                }}
                disabled={isLoading || rows.length === 0}
              >
                {dict.allAbsent || "All Absent"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                  setRows((r) => r.map((x) => ({ ...x, status: "late" })))
                  setChanged(() => {
                    const next: Record<string, AttendanceRow["status"]> = {}
                    rows.forEach((r) => {
                      next[r.studentId] = "late"
                    })
                    return next
                  })
                }}
                disabled={isLoading || rows.length === 0}
              >
                {dict.allLate || "All Late"}
              </Button>
              <Button
                size="sm"
                className="h-9"
                onClick={onSubmit}
                disabled={
                  submitting || isLoading || !Object.keys(changed).length
                }
              >
                {submitting
                  ? "Saving..."
                  : dict.saveAttendance || "Save Attendance"}
              </Button>
            </div>
          </div>
          {rows.length === 0 && sectionId && !isLoading ? (
            <NoStudentsEmptyState
              dictionary={dictionary?.attendance}
              locale={lang}
            />
          ) : (
            <AttendanceTable
              data={rows}
              columns={getAttendanceColumns(dictionary?.attendance)}
              onChangeStatus={onChangeStatus}
            />
          )}
        </div>
      )}
    </AttendanceErrorBoundary>
  )
}
