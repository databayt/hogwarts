"use client"

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
} from "@/components/platform/attendance/actions"

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
}

export function AttendanceContent({ dictionary }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [classId, setClassId] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>(
    []
  )
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
      const result = await getAttendanceList({ classId, date })
      if (result.success && result.data) {
        setRows(result.data.rows)
      }
    } finally {
      setIsLoading(false)
    }
  }, [classId, date])

  useEffect(() => {
    void load()
  }, [load])

  // Load classes and auto-select based on current timetable period
  useEffect(() => {
    ;(async () => {
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
      if (e.key.toLowerCase() === "p")
        setRows((r) => r.map((x) => ({ ...x, status: "present" })))
      if (e.key.toLowerCase() === "a")
        setRows((r) => r.map((x) => ({ ...x, status: "absent" })))
      if (e.key.toLowerCase() === "l")
        setRows((r) => r.map((x) => ({ ...x, status: "late" })))
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void onSubmit()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onSubmit])
  return (
    <AttendanceErrorBoundary>
      {isLoading && !rows.length ? (
        <AttendanceTableSkeleton rows={10} />
      ) : classes.length === 0 && !isLoading ? (
        <NoClassesEmptyState dictionary={dictionary?.attendance} />
      ) : (
        <div className="grid gap-3">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-muted-foreground mb-2 text-sm">
              {dict.title}
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
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
                  <SelectTrigger className="h-8 w-56">
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
              </div>
              <Input
                type="date"
                className="h-8 w-44"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLoading}
              />
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRows((r) => r.map((x) => ({ ...x, status: "present" })))
                  }
                  disabled={isLoading || rows.length === 0}
                >
                  {dict.allPresent || "All Present"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRows((r) => r.map((x) => ({ ...x, status: "absent" })))
                  }
                  disabled={isLoading || rows.length === 0}
                >
                  {dict.allAbsent || "All Absent"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRows((r) => r.map((x) => ({ ...x, status: "late" })))
                  }
                  disabled={isLoading || rows.length === 0}
                >
                  {dict.allLate || "All Late"}
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={submitting || isLoading || !Object.keys(changed).length}
            >
              {submitting
                ? "Saving..."
                : dict.saveAttendance || "Save Attendance"}
            </Button>
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
