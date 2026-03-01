"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { AlertCircle } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  getGuardianChildrenAttendance,
  getStudentOwnAttendance,
} from "@/components/school-dashboard/attendance/actions/records"
import { AttendanceView } from "@/components/school-dashboard/parent-portal/attendance/view"

interface Props {
  locale: Locale
  subdomain: string
}

// Match the Student/Attendance types expected by AttendanceView
type Attendance = {
  id: string
  date: Date
  status: string
  classId: string
  className: string
  notes: string | null
}

type Student = {
  id: string
  name: string
  email: string | null
  classes: Array<{ id: string; name: string; teacher: string }>
  attendances: Attendance[]
}

export function RecordsContent({ locale }: Props) {
  const { dictionary } = useDictionary()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = dictionary?.school?.attendance as Record<string, any> | undefined
  const [isPending, startTransition] = useTransition()
  const [students, setStudents] = useState<Student[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      // Try guardian first (multiple children)
      const guardianResult = await getGuardianChildrenAttendance()
      if (guardianResult.success && guardianResult.data?.students.length) {
        setStudents(
          guardianResult.data.students.map((s) => ({
            ...s,
            attendances: s.attendances.map((a) => ({
              id: a.id,
              date: new Date(a.date),
              status: a.status,
              classId: a.classId || "",
              className: a.className,
              notes: a.notes,
            })),
          }))
        )
        return
      }

      // Try student (own records)
      const studentResult = await getStudentOwnAttendance()
      if (studentResult.success && studentResult.data) {
        const { records } = studentResult.data
        setStudents([
          {
            id: "self",
            name: d?.myRecords || "My Records",
            email: null,
            classes: [],
            attendances: records.map((r) => ({
              id: r.id,
              date: new Date(r.date),
              status: r.status,
              classId: r.classId || "",
              className: r.className || "",
              notes: r.notes,
            })),
          },
        ])
        return
      }

      setError(
        (!studentResult.success ? studentResult.error : undefined) ||
          (!guardianResult.success ? guardianResult.error : undefined) ||
          "Unable to load records"
      )
    })
  }, [d])

  if (isPending || (!students && !error)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error || !students) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="text-muted-foreground h-12 w-12" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return <AttendanceView students={students} locale={locale} />
}
