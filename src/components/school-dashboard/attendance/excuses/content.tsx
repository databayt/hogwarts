"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { AlertCircle, Calendar, FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  getExcusesForStudent,
  getUnexcusedAbsences,
} from "@/components/school-dashboard/attendance/actions/excuses"
import { getGuardianChildrenAttendance } from "@/components/school-dashboard/attendance/actions/records"
import { ExcuseReviewList } from "@/components/school-dashboard/attendance/excuses/excuse-review"
import {
  ExcuseForm,
  ExcuseStatusBadge,
  UnexcusedAbsenceCard,
} from "@/components/school-dashboard/parent-portal/attendance/excuse-form"

interface Props {
  locale: Locale
  subdomain: string
  role: string
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export function ExcusesContent({ locale, role }: Props) {
  const isStaff = STAFF_ROLES.includes(role)

  if (isStaff) {
    return <StaffExcusesView locale={locale} />
  }

  return <GuardianExcusesView locale={locale} />
}

// --- Staff view: review pending excuses ---
function StaffExcusesView({ locale }: { locale: Locale }) {
  return (
    <div className="space-y-6">
      <ExcuseReviewList locale={locale} />
    </div>
  )
}

// --- Guardian/Student view: see unexcused absences + submit excuses + history ---
type UnexcusedAbsence = {
  id: string
  studentId: string
  studentName: string
  classId: string
  className: string
  date: string
  status: string
}

type ExcuseRecord = {
  id: string
  attendanceId: string
  date: string
  className: string
  reason: string
  description: string | null
  status: string
  submittedAt: string
  reviewedAt: string | null
  reviewNotes: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

function GuardianExcusesView({ locale }: { locale: Locale }) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.attendance as Dict | undefined
  const [isPending, startTransition] = useTransition()

  const [absences, setAbsences] = useState<UnexcusedAbsence[]>([])
  const [excuseHistory, setExcuseHistory] = useState<ExcuseRecord[]>([])
  const [studentIds, setStudentIds] = useState<string[]>([])
  const [selectedAbsence, setSelectedAbsence] =
    useState<UnexcusedAbsence | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      // Get children IDs first
      const childrenResult = await getGuardianChildrenAttendance()
      if (!childrenResult.success || !childrenResult.data?.students.length) {
        // Might be a student — fetch their own unexcused
        const ownResult = await getUnexcusedAbsences()
        if (ownResult.success && ownResult.data) {
          setAbsences(ownResult.data.absences)
        } else {
          setError(
            (!ownResult.success ? ownResult.error : undefined) ||
              "Unable to load data"
          )
        }
        return
      }

      const ids = childrenResult.data.students.map((s) => s.id)
      setStudentIds(ids)

      // Fetch unexcused absences and excuse history in parallel
      const [absenceResult, ...excuseResults] = await Promise.all([
        getUnexcusedAbsences(),
        ...ids.map((id) => getExcusesForStudent(id)),
      ])

      if (absenceResult.success && absenceResult.data) {
        setAbsences(absenceResult.data.absences)
      }

      const allExcuses = excuseResults.flatMap((r) =>
        r.success && r.data ? r.data.excuses : []
      )
      setExcuseHistory(
        allExcuses.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        )
      )
    })
  }, [])

  const handleExcuseSubmitted = () => {
    setSelectedAbsence(null)
    // Refresh data
    startTransition(async () => {
      const absenceResult = await getUnexcusedAbsences()
      if (absenceResult.success && absenceResult.data) {
        setAbsences(absenceResult.data.absences)
      }
      const excuseResults = await Promise.all(
        studentIds.map((id) => getExcusesForStudent(id))
      )
      const allExcuses = excuseResults.flatMap((r) =>
        r.success && r.data ? r.data.excuses : []
      )
      setExcuseHistory(
        allExcuses.sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        )
      )
    })
  }

  if (isPending && absences.length === 0 && excuseHistory.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="text-muted-foreground h-12 w-12" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  const isArabic = locale === "ar"

  return (
    <div className="space-y-6">
      {/* Unexcused Absences */}
      {absences.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              {d?.pendingExcuses || "Unexcused Absences"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "هذه الغيابات تحتاج إلى تقديم عذر"
                : "These absences need an excuse submitted"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {absences.map((absence) => (
              <UnexcusedAbsenceCard
                key={absence.id}
                absence={{
                  id: absence.id,
                  studentId: absence.studentId,
                  studentName: absence.studentName,
                  classId: absence.classId,
                  className: absence.className,
                  date: absence.date,
                  status: absence.status,
                }}
                onSubmitExcuse={() => setSelectedAbsence(absence)}
                locale={locale}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {absences.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="text-muted-foreground">
              {isArabic ? "لا توجد غيابات بدون عذر" : "No unexcused absences"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Excuse History */}
      {excuseHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? "سجل الأعذار" : "Excuse History"}</CardTitle>
            <CardDescription>
              {isArabic
                ? "الأعذار المقدمة سابقاً"
                : "Previously submitted excuses"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {excuseHistory.map((excuse) => (
                <div
                  key={excuse.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-4 w-4" />
                      <span className="text-sm">
                        {new Date(excuse.date).toLocaleDateString(locale)}
                      </span>
                      <Badge variant="outline">{excuse.className}</Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {excuse.reason}
                      {excuse.description ? ` - ${excuse.description}` : ""}
                    </p>
                    {excuse.reviewNotes && (
                      <p className="text-xs italic">
                        {isArabic ? "ملاحظة:" : "Note:"} {excuse.reviewNotes}
                      </p>
                    )}
                  </div>
                  <ExcuseStatusBadge status={excuse.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Excuse Form Dialog */}
      {selectedAbsence && (
        <ExcuseForm
          absence={{
            id: selectedAbsence.id,
            studentId: selectedAbsence.studentId,
            studentName: selectedAbsence.studentName,
            classId: selectedAbsence.classId,
            className: selectedAbsence.className,
            date: selectedAbsence.date,
            status: selectedAbsence.status,
          }}
          open={!!selectedAbsence}
          onOpenChange={(open: boolean) => {
            if (!open) setSelectedAbsence(null)
          }}
          onSuccess={handleExcuseSubmitted}
          locale={locale}
        />
      )}
    </div>
  )
}
