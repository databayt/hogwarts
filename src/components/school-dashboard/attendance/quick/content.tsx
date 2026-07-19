"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  CalendarOff,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  MessageCircle,
  Search,
  UserX,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getAttendanceList } from "../actions"
import { getQuickMarkingContext, submitQuickAttendance } from "../actions/quick"
import { ClockCard } from "./clock-card"

type RowStatus = "present" | "absent" | "late"

interface QuickSection {
  id: string
  name: string
  gradeName: string
  studentCount: number
  markedCount: number
  scheduledToday: boolean
  periodName: string | null
  periodStart: string | null
  periodEnd: string | null
  isCurrent: boolean
}

interface RosterRow {
  studentId: string
  name: string
  status: RowStatus
}

interface SavedSummary {
  total: number
  present: number
  absent: number
  late: number
  guardiansNotified: number
  absentNames: string[]
}

const CYCLE: Record<RowStatus, RowStatus> = {
  present: "absent",
  absent: "late",
  late: "present",
}

export function QuickAttendanceContent({ locale }: { locale: Locale }) {
  const { dictionary } = useDictionary()
  const att = dictionary?.school?.attendance as any
  const q = (att?.quick ?? {}) as Record<string, any>
  const basePath = `/${locale}/attendance`

  const [sections, setSections] = useState<QuickSection[] | null>(null)
  const [isSchoolDay, setIsSchoolDay] = useState(true)
  const [today, setToday] = useState<string | null>(null)
  const [sectionId, setSectionId] = useState<string | null>(null)
  const [roster, setRoster] = useState<RosterRow[] | null>(null)
  const [search, setSearch] = useState("")
  const [saved, setSaved] = useState<SavedSummary | null>(null)
  const [isLoadingRoster, startRosterLoad] = useTransition()
  const [isSaving, startSave] = useTransition()

  useEffect(() => {
    getQuickMarkingContext().then((res) => {
      if (res.success && res.data) {
        setSections(res.data.sections)
        setIsSchoolDay(res.data.isSchoolDay)
        setToday(res.data.today)
        if (res.data.sections.length > 0) {
          setSectionId(res.data.sections[0].id)
        }
      } else {
        setSections([])
      }
    })
  }, [])

  useEffect(() => {
    if (!sectionId || !today) return
    setSaved(null)
    setSearch("")
    setRoster(null)
    startRosterLoad(async () => {
      const res = await getAttendanceList({
        sectionId,
        date: today.split("T")[0],
        lang: locale,
      })
      if (res.success && res.data) {
        setRoster(
          res.data.rows.map((r) => ({
            studentId: r.studentId,
            name: r.name,
            status: r.status,
          }))
        )
      } else {
        setRoster([])
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, today])

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [locale]
  )

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0 }
    for (const r of roster ?? []) c[r.status]++
    return c
  }, [roster])

  const filtered = useMemo(() => {
    if (!roster) return []
    const term = search.trim().toLowerCase()
    if (!term) return roster
    return roster.filter((r) => r.name.toLowerCase().includes(term))
  }, [roster, search])

  const selectedSection = sections?.find((s) => s.id === sectionId) ?? null

  function cycleStudent(studentId: string) {
    setRoster(
      (prev) =>
        prev?.map((r) =>
          r.studentId === studentId ? { ...r, status: CYCLE[r.status] } : r
        ) ?? null
    )
  }

  function onSave() {
    if (!sectionId || !today || !roster) return
    startSave(async () => {
      const absent = roster.filter((r) => r.status === "absent")
      const late = roster.filter((r) => r.status === "late")
      const res = await submitQuickAttendance({
        sectionId,
        date: today.split("T")[0],
        absentStudentIds: absent.map((r) => r.studentId),
        lateStudentIds: late.map((r) => r.studentId),
      })
      if (res.success && res.data) {
        setSaved({
          ...res.data,
          absentNames: absent.map((r) => r.name),
        })
        // Refresh the chip's marked count
        setSections(
          (prev) =>
            prev?.map((s) =>
              s.id === sectionId ? { ...s, markedCount: res.data!.total } : s
            ) ?? null
        )
      } else {
        toast.error(q.saveFailed ?? "Failed to save attendance")
      }
    })
  }

  const fmt = (
    template: string | undefined,
    fallback: string,
    vars: Record<string, string | number>
  ) => {
    let out = template ?? fallback
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(`{${k}}`, String(v))
    }
    return out
  }

  // ------------------------------------------------------------------ render

  if (sections !== null && sections.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <ClockCard locale={locale} dictionary={q.clock} />
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            {q.noSections ?? "No sections assigned to you yet"}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 pb-24">
      {/* My-day clock (timesheet integration) */}
      <ClockCard locale={locale} dictionary={q.clock} />

      {/* Title + date */}
      <div>
        <h2 className="text-lg font-semibold">
          {q.title ?? "Quick Attendance"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {today ? dateFormatter.format(new Date(today)) : " "}
          {!isSchoolDay && (
            <span className="ms-2 inline-flex items-center gap-1 text-xs">
              <CalendarOff className="h-3.5 w-3.5" />
              {q.noSchoolToday ?? "No school today"}
            </span>
          )}
        </p>
      </div>

      {/* Section chips — current period first */}
      {sections === null ? (
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => {
            const fullyMarked =
              s.studentCount > 0 && s.markedCount >= s.studentCount
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSectionId(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors",
                  s.id === sectionId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                )}
              >
                {s.isCurrent && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                )}
                <span className="max-w-36 truncate">{s.name}</span>
                {s.periodName && (
                  <span
                    className={cn(
                      "text-xs",
                      s.id === sectionId
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    )}
                  >
                    {s.isCurrent ? (q.now ?? "Now") : s.periodStart}
                  </span>
                )}
                {fullyMarked && <Check className="h-3.5 w-3.5" />}
              </button>
            )
          })}
        </div>
      )}

      {/* Saved success panel */}
      {saved ? (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="font-medium">
                {q.savedTitle ?? "Attendance saved"}
              </p>
            </div>
            <p className="text-sm">
              {fmt(
                q.savedSummary,
                "{present} present · {absent} absent · {late} late",
                {
                  present: saved.present,
                  absent: saved.absent,
                  late: saved.late,
                }
              )}
            </p>
            <p className="text-muted-foreground text-xs">
              {saved.guardiansNotified > 0
                ? fmt(
                    q.guardiansNotified,
                    "{count} guardians notified about the absence",
                    { count: saved.guardiansNotified }
                  )
                : (q.noGuardiansNotified ?? "No guardian notifications sent")}
            </p>
            {saved.absentNames.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium">
                  {q.absentToday ?? "Absent today"}
                </p>
                {saved.absentNames.map((name) => (
                  <div
                    key={name}
                    className="bg-background flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <span className="truncate text-sm">{name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-xs"
                    >
                      <Link href={`/${locale}/messages`}>
                        <MessageCircle className="me-1 h-3.5 w-3.5" />
                        {q.messageGuardian ?? "Message guardian"}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setSaved(null)}
            >
              {q.markAnother ?? "Mark another section"}
              <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hint + search */}
          <p className="text-muted-foreground text-xs">
            {q.subtitle ??
              "Tap the absent students — everyone else is marked present"}
          </p>
          <div className="relative">
            <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={q.searchPlaceholder ?? "Find a student..."}
              className="h-11 ps-9"
            />
          </div>

          {/* Roster */}
          {isLoadingRoster || roster === null ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-13 w-full rounded-lg" />
              ))}
            </div>
          ) : roster.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-center text-sm">
                {q.noStudents ?? "No students in this section"}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((r) => (
                <button
                  key={r.studentId}
                  type="button"
                  onClick={() => cycleStudent(r.studentId)}
                  className={cn(
                    "flex min-h-13 w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors",
                    r.status === "absent"
                      ? "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
                      : r.status === "late"
                        ? "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                        : "bg-background hover:bg-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                      r.status === "absent"
                        ? "bg-red-500 text-white"
                        : r.status === "late"
                          ? "bg-amber-500 text-white"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {r.status === "absent" ? (
                      <UserX className="h-4 w-4" />
                    ) : r.status === "late" ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      r.name.charAt(0)
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {r.name}
                  </span>
                  {r.status !== "present" && (
                    <Badge
                      variant={
                        r.status === "absent" ? "destructive" : "outline"
                      }
                      className={cn(
                        "text-xs",
                        r.status === "late" && "border-amber-500 text-amber-600"
                      )}
                    >
                      {r.status === "absent"
                        ? (q.absent ?? "absent")
                        : (q.late ?? "late")}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sticky save bar */}
      {!saved && roster !== null && roster.length > 0 && (
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-20 border-t p-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-medium text-emerald-600">
                {counts.present}
              </span>{" "}
              <span className="text-muted-foreground">
                {q.present ?? "present"}
              </span>
              {counts.absent > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-red-600">
                    {counts.absent}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {q.absent ?? "absent"}
                  </span>
                </>
              )}
              {counts.late > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-amber-600">
                    {counts.late}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    {q.late ?? "late"}
                  </span>
                </>
              )}
            </div>
            <Button onClick={onSave} disabled={isSaving} className="h-11 px-6">
              {isSaving
                ? (q.saving ?? "Saving...")
                : (q.save ?? "Save attendance")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
