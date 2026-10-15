"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Class list — the main way to take attendance. One row of choices (section,
 * day), one list, one Save. Everyone starts present; the teacher touches the
 * exceptions. Keyboard: P / A / L mark everyone, ⌘S / Ctrl+S saves.
 */
import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  getAttendanceList,
  getCurrentPeriod,
  getSectionsForSelection,
  markAttendance,
} from "@/components/school-dashboard/attendance/actions"
import { SaveStatus } from "@/components/school-dashboard/school/configuration/ui/save-status"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { calendarDayToStoredISO, localCalendarDay } from "./core/local-date"
import { NoClassesEmptyState, NoStudentsEmptyState } from "./empty-state"
import { AttendanceErrorBoundary } from "./error-boundary"
import {
  AttendanceRoster,
  type AttendanceRow,
  type AttendanceStatusValue,
} from "./table"
import { AttendanceSectionNav } from "./ui/section-nav"

interface Props {
  lang?: string
  /** Open on this section (e.g. from the overview's unmarked list). */
  initialSectionId?: string
}

interface SectionOption {
  id: string
  name: string
  gradeName: string
}

const fill = (tpl: string, vars: Record<string, string | number>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""))

export function AttendanceContent({ lang = "ar", initialSectionId }: Props) {
  const { dictionary } = useDictionary()
  const d = dictionary
  const t = (d?.attendanceTake?.manual ?? {}) as Record<string, string>
  const hubStatus = (d?.attendanceHub?.status ?? {}) as Record<string, string>
  const labels: Record<AttendanceStatusValue, string> = {
    present: hubStatus.PRESENT ?? "Present",
    absent: hubStatus.ABSENT ?? "Absent",
    late: hubStatus.LATE ?? "Late",
  }
  const num = useMemo(
    () => new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-latn" : "en-US"),
    [lang]
  )

  const today = useMemo(() => localCalendarDay(), [])
  const [sections, setSections] = useState<SectionOption[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [sectionId, setSectionId] = useState("")
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null)
  const [dayMode, setDayMode] = useState<"today" | "other">("today")
  const [otherDate, setOtherDate] = useState(today)
  const date = dayMode === "today" ? today : otherDate || today

  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [changed, setChanged] = useState<Record<string, AttendanceStatusValue>>(
    {}
  )
  const [submitting, setSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  // Sections, then pick: the linked one › the one being taught now › first.
  useEffect(() => {
    ;(async () => {
      try {
        const [sectionsRes, periodRes] = await Promise.all([
          getSectionsForSelection(),
          getCurrentPeriod(),
        ])
        if (!sectionsRes.success || !sectionsRes.data) return
        const list = sectionsRes.data.sections
        setSections(list)
        const has = (id?: string | null) =>
          Boolean(id && list.some((s) => s.id === id))
        const nowId = periodRes.success
          ? (periodRes.data?.currentPeriod?.sectionId ?? null)
          : null
        if (has(nowId)) setCurrentSectionId(nowId)
        if (has(initialSectionId)) setSectionId(initialSectionId!)
        else if (has(nowId)) setSectionId(nowId!)
        else if (list[0]) setSectionId((cur) => cur || list[0].id)
      } finally {
        setSectionsLoading(false)
      }
    })()
  }, [initialSectionId])

  const load = useCallback(async () => {
    if (!sectionId) {
      setRows([])
      return
    }
    setIsLoading(true)
    try {
      const result = await getAttendanceList({ sectionId, date, lang })
      if (result.success && result.data) {
        setRows(
          result.data.rows.map((r) => ({
            studentId: r.studentId,
            name: r.name,
            status: r.status,
            marked: Boolean(r.method),
          }))
        )
        setChanged({})
      }
    } finally {
      setIsLoading(false)
    }
  }, [sectionId, date, lang])

  useEffect(() => {
    void load()
  }, [load])

  const setStatus = useCallback(
    (studentId: string, status: AttendanceStatusValue) => {
      setChanged((prev) => ({ ...prev, [studentId]: status }))
      setRows((prev) =>
        prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
      )
    },
    []
  )

  const rowsRef = useRef(rows)
  rowsRef.current = rows
  const setAll = useCallback((status: AttendanceStatusValue) => {
    const ids = rowsRef.current.map((r) => r.studentId)
    setChanged((c) => {
      const next = { ...c }
      for (const id of ids) next[id] = status
      return next
    })
    setRows((prev) => prev.map((r) => ({ ...r, status })))
  }, [])

  // What Save sends: every change, plus anyone with no stored mark yet (their
  // "present" is only the default until saved). Re-sending stored, unchanged
  // absences would re-notify guardians, so those stay out.
  const pending = useMemo(
    () => rows.filter((r) => changed[r.studentId] || !r.marked),
    [rows, changed]
  )

  const onSubmit = useCallback(async () => {
    if (pending.length === 0 || submitting || !sectionId) return
    const sent = pending.map((r) => ({
      studentId: r.studentId,
      status: r.status,
    }))
    setSubmitting(true)
    try {
      const result = await markAttendance({
        sectionId,
        date: calendarDayToStoredISO(date),
        records: sent,
      })
      if (!result?.success) {
        // Keep the unsaved marks on screen so Save retries them.
        ErrorToast(t.failed ?? "Couldn't save. Try again.")
        return
      }
      const sentStatus = new Map(sent.map((r) => [r.studentId, r.status]))
      setRows((prev) =>
        prev.map((r) =>
          sentStatus.get(r.studentId) === r.status ? { ...r, marked: true } : r
        )
      )
      // Clear only what was sent and not changed again while saving.
      setChanged((current) => {
        const next = { ...current }
        for (const [id, status] of sentStatus)
          if (next[id] === status) delete next[id]
        return next
      })
      setSavedAt(Date.now())
    } catch {
      ErrorToast(t.failed ?? "Couldn't save. Try again.")
    } finally {
      setSubmitting(false)
    }
  }, [pending, submitting, sectionId, date, t.failed])

  // Keyboard shortcuts — kept from the old screen.
  const submitRef = useRef(onSubmit)
  submitRef.current = onSubmit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el?.isContentEditable
      )
        return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void submitRef.current()
        return
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === "p") setAll("present")
      else if (k === "a") setAll("absent")
      else if (k === "l") setAll("late")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setAll])

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0 }
    for (const r of rows) c[r.status]++
    return c
  }, [rows])

  const dirty = useMemo(() => new Set(Object.keys(changed)), [changed])
  const allMarked = rows.length > 0 && rows.every((r) => r.marked)

  return (
    <AttendanceErrorBoundary>
      <div className="space-y-6 pb-24">
        <AttendanceSectionNav group="take" />

        {sectionsLoading ? (
          <RosterSkeleton />
        ) : sections.length === 0 ? (
          <NoClassesEmptyState
            dictionary={d?.school?.attendance}
            locale={lang}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={sectionId}
                onValueChange={setSectionId}
                disabled={submitting}
              >
                <SelectTrigger
                  className="h-9 w-full rounded-full sm:w-64"
                  aria-label={t.section ?? "Section"}
                >
                  <SelectValue placeholder={t.section ?? "Section"} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        {s.gradeName && !s.name.includes(s.gradeName)
                          ? `${s.gradeName} · ${s.name}`
                          : s.name}
                        {s.id === currentSectionId ? (
                          <span className="text-primary flex items-center gap-1 text-xs">
                            <Clock className="size-3" />
                            {t.now ?? "Now"}
                          </span>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Segmented
                value={dayMode}
                onValueChange={setDayMode}
                options={[
                  { value: "today", label: t.today ?? "Today" },
                  { value: "other", label: t.otherDay ?? "Another day" },
                ]}
                aria-label={t.date ?? "Date"}
              />

              {dayMode === "other" ? (
                <Input
                  type="date"
                  className="h-9 w-auto rounded-full"
                  value={otherDate}
                  max={today}
                  onChange={(e) => setOtherDate(e.target.value)}
                  aria-label={t.date ?? "Date"}
                />
              ) : null}
            </div>

            {isLoading ? (
              <RosterSkeleton />
            ) : rows.length === 0 ? (
              <NoStudentsEmptyState
                dictionary={d?.school?.attendance}
                locale={lang}
              />
            ) : (
              <section className="space-y-2">
                <div className="flex items-center justify-between gap-3 px-4">
                  <p className="text-muted-foreground text-xs">
                    {fill(
                      t.summary ??
                        "{present} present · {absent} absent · {late} late",
                      {
                        present: num.format(counts.present),
                        absent: num.format(counts.absent),
                        late: num.format(counts.late),
                      }
                    )}
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setAll("present")}
                    disabled={submitting}
                  >
                    {t.markAllPresent ?? "Mark all present"}
                  </Button>
                </div>
                <AttendanceRoster
                  rows={rows}
                  labels={labels}
                  dirty={dirty}
                  onChangeStatus={setStatus}
                  disabled={submitting}
                />
                <p className="text-muted-foreground hidden px-4 text-xs md:block">
                  {t.shortcuts ??
                    "Shortcuts: P everyone present · A absent · L late · Ctrl+S save"}
                </p>
              </section>
            )}
          </>
        )}
      </div>

      {rows.length > 0 && !isLoading ? (
        <div className="bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky bottom-0 z-10 -mx-4 border-t px-4 py-3 backdrop-blur md:mx-0 md:rounded-2xl md:border">
          <div className="flex items-center justify-end gap-4">
            <span className="text-muted-foreground me-auto text-xs">
              {pending.length > 0
                ? fill(t.unsaved ?? "{n} not saved yet", {
                    n: num.format(pending.length),
                  })
                : allMarked
                  ? (t.allSaved ?? "Everyone is saved for this day")
                  : null}
            </span>
            <SaveStatus pending={submitting} savedAt={savedAt} />
            <Button
              className="rounded-full px-6"
              onClick={() => void onSubmit()}
              disabled={submitting || pending.length === 0}
            >
              {t.save ?? "Save"}
            </Button>
          </div>
        </div>
      ) : null}
    </AttendanceErrorBoundary>
  )
}

function RosterSkeleton() {
  return (
    <div className="divide-border/60 divide-y overflow-hidden rounded-2xl border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ms-auto h-8 w-56 rounded-full" />
        </div>
      ))}
    </div>
  )
}
