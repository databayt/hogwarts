"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState, useTransition } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { getParentAttendanceSummary } from "@/components/school-dashboard/attendance/actions/dashboard"
import {
  getExcusesForStudent,
  getUnexcusedAbsences,
} from "@/components/school-dashboard/attendance/actions/excuses"
import { ExcuseReviewList } from "@/components/school-dashboard/attendance/excuses/excuse-review"
import { ExcuseForm } from "@/components/school-dashboard/parent-portal/attendance/excuse-form"

import { fill, formatDay } from "../overview/format"
import { AttendanceSectionNav } from "../ui/section-nav"

interface Props {
  locale: Locale
  subdomain: string
  role: string
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export function ExcusesContent({ locale, role }: Props) {
  const isStaff = STAFF_ROLES.includes(role)
  // Planned absences are filed by guardians and reviewed by staff, so both
  // get the Excuses | Planned absences bar; students only see their excuses.
  const showNav = isStaff || role === "GUARDIAN"

  return (
    <div className="max-w-3xl space-y-6">
      {showNav ? <AttendanceSectionNav group="excuses" /> : null}
      {isStaff ? (
        <ExcuseReviewList locale={locale} />
      ) : (
        <FamilyExcusesView locale={locale} />
      )}
    </div>
  )
}

// --- Guardian/Student: absences without an excuse, then the history ---

type UnexcusedAbsence = {
  id: string
  studentId: string
  studentName: string
  sectionId: string | null
  className: string
  date: string
  status: string
}

type ExcuseRecord = {
  id: string
  date: string
  className: string
  reason: string
  status: string
  submittedAt: string
  reviewNotes: string | null
  studentName?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

function FamilyExcusesView({ locale }: { locale: Locale }) {
  const { dictionary } = useDictionary()
  const t = ((dictionary as Dict | undefined)?.attendanceToday?.excuses ??
    {}) as Dict
  const [isPending, startTransition] = useTransition()
  const [absences, setAbsences] = useState<UnexcusedAbsence[] | null>(null)
  const [history, setHistory] = useState<ExcuseRecord[]>([])
  const [multiChild, setMultiChild] = useState(false)
  const [selected, setSelected] = useState<UnexcusedAbsence | null>(null)

  const load = useCallback(() => {
    startTransition(async () => {
      const [open, family] = await Promise.all([
        getUnexcusedAbsences().catch(() => null),
        getParentAttendanceSummary().catch(() => null),
      ])
      setAbsences(open?.success && open.data ? open.data.absences : [])

      const children =
        family?.success && family.data ? family.data.children : []
      setMultiChild(children.length > 1)
      const results = await Promise.all(
        children.map((c) =>
          getExcusesForStudent(c.studentId)
            .then((r) =>
              r.success && r.data
                ? r.data.excuses.map((e) => ({
                    ...e,
                    studentName: c.studentName,
                  }))
                : []
            )
            .catch(() => [])
        )
      )
      setHistory(
        results
          .flat()
          .sort(
            (a, b) =>
              new Date(b.submittedAt).getTime() -
              new Date(a.submittedAt).getTime()
          )
      )
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (absences === null) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-muted-foreground px-4 text-xs font-medium">
          {t.toExcuse ?? "Absences without an excuse"}
        </h2>
        <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
          {absences.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">
              {t.noUnexcused ?? "Every absence has an excuse."}
            </p>
          ) : (
            absences.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {formatDay(a.date, locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {[a.studentName, a.className].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => setSelected(a)}
                  disabled={isPending}
                >
                  {t.submit ?? "Submit excuse"}
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      {history.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-muted-foreground px-4 text-xs font-medium">
            {t.history ?? "Submitted excuses"}
          </h2>
          <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
            {history.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {formatDay(e.date, locale)}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {[
                      multiChild ? e.studentName : null,
                      t.reasons?.[e.reason] ?? e.reason,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {e.reviewNotes ? (
                    <p className="text-muted-foreground truncate text-xs">
                      {fill(
                        t.reviewNote,
                        { note: e.reviewNotes },
                        e.reviewNotes
                      )}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    e.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : e.status === "REJECTED"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {t.status?.[e.status] ?? e.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {selected ? (
        <ExcuseForm
          absence={selected}
          open={!!selected}
          onOpenChange={(open: boolean) => {
            if (!open) setSelected(null)
          }}
          onSuccess={() => {
            setSelected(null)
            load()
          }}
          locale={locale}
        />
      ) : null}
    </div>
  )
}
