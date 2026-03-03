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
  getClassesForSelection,
  getCurrentPeriod,
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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Props {
  dictionary?: Dictionary["school"]
  lang?: string
}

export function AttendanceContent({ dictionary, lang }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [classId, setClassId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [classesLoading, setClassesLoading] = useState(true)

  // Smart class selection from timetable
  const [currentPeriodInfo, setCurrentPeriodInfo] = useState<{
    classId: string | null
    periodName: string | null
    subjectName: string | null
    isAutoSelected: boolean
  }>({
    classId: null,
    periodName: null,
    subjectName: null,
    isAutoSelected: false,
  })

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      if (!classId) {
        setRows([])
        return
      }
      const result = await getAttendanceList({ classId, date, lang })
      if (result.success && result.data) {
        setRows(result.data.rows)
      }
    } finally {
      setIsLoading(false)
    }
  }, [classId, date, lang])

  useEffect(() => {
    void load()
  }, [load])

  // Load classes and auto-select based on current timetable period
  useEffect(() => {
    ;(async () => {
      try {
        const [classesRes, periodRes] = await Promise.all([
          getClassesForSelection(),
          getCurrentPeriod(),
        ])

        if (!classesRes.success || !classesRes.data) return
        setClasses(classesRes.data.classes)

        // Smart selection: Use current period's class if available
        if (
          periodRes.success &&
          periodRes.data?.currentPeriod?.classId &&
          classesRes.data.classes.some(
            (c) => c.id === periodRes.data?.currentPeriod?.classId
          )
        ) {
          setClassId(periodRes.data.currentPeriod.classId)
          setCurrentPeriodInfo({
            classId: periodRes.data.currentPeriod.classId,
            periodName: periodRes.data.currentPeriod.periodName,
            subjectName: periodRes.data.currentPeriod.subjectName,
            isAutoSelected: true,
          })
        } else if (!classId && classesRes.data.classes[0]) {
          // Fallback to first class if no current period
          setClassId(classesRes.data.classes[0].id)
        }
      } finally {
        setClassesLoading(false)
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
        classId,
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
      {isLoading || classesLoading ? (
        <AttendanceTableSkeleton rows={10} />
      ) : classes.length === 0 ? (
        <NoClassesEmptyState dictionary={dictionary?.attendance} />
      ) : (
        <div className="space-y-3">
          <div
            role="toolbar"
            aria-orientation="horizontal"
            className="flex w-full flex-wrap items-center gap-2 p-1"
          >
            <Select
              value={classId}
              onValueChange={(val) => {
                setClassId(val)
                // Clear auto-selected flag when user manually changes
                if (val !== currentPeriodInfo.classId) {
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
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.name}
                      {c.id === currentPeriodInfo.classId && (
                        <Clock className="h-3 w-3 text-blue-500" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Smart selection indicator */}
            {currentPeriodInfo.isAutoSelected &&
              classId === currentPeriodInfo.classId && (
                <Badge
                  variant="secondary"
                  className="flex h-6 items-center gap-1 bg-blue-100 text-xs text-blue-700"
                >
                  <Sparkles className="h-3 w-3" />
                  {currentPeriodInfo.periodName}
                  {currentPeriodInfo.subjectName &&
                    ` • ${currentPeriodInfo.subjectName}`}
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
          {rows.length === 0 && classId && !isLoading ? (
            <NoStudentsEmptyState dictionary={dictionary?.attendance} />
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
