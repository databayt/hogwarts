"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subjects & sections editor — one teacher's teaching assignments.
 *
 * Shared by the Add Teacher wizard step and the teachers row-action dialog.
 * Pick a grade, tick a subject (every free section of the grade is ticked
 * with it), adjust single sections. A section someone else teaches shows
 * their name and stays unticked unless clicked, which hands it over. Saving
 * writes the timetable: the teacher's periods fill in, moving others inside
 * the section when needed (timetable/assignments).
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useTransition,
} from "react"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  confirmDeleteDialog,
  ErrorToast,
  SuccessToast,
} from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  getTeacherSubjects,
  saveTeacherSubjects,
  type AssignmentSummary,
} from "@/components/school-dashboard/timetable/assignments/actions"
import type { TeacherEditorData } from "@/components/school-dashboard/timetable/assignments/queries"

import { useTakePrefetchedSubjects } from "./prefetch"

type Labels = Record<string, string> & {
  reasons?: Record<string, string>
  days?: string[]
}

const key = (sectionId: string, subjectId: string) =>
  `${sectionId}:${subjectId}`

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (out, [k, v]) => out.replace(`{${k}}`, String(v)),
    template
  )

export interface TeacherSubjectsEditorHandle {
  /** Save the current selection; rejects if the admin cancels or it fails. */
  saveAndNext: () => Promise<void>
}

interface Props {
  teacherId: string
  /** Dialog use: render a Save button. The wizard saves from its footer. */
  showSaveButton?: boolean
  onSaved?: (summary: AssignmentSummary) => void
}

export const TeacherSubjectsEditor = forwardRef<
  TeacherSubjectsEditorHandle,
  Props
>(function TeacherSubjectsEditor({ teacherId, showSaveButton, onSaved }, ref) {
  const { dictionary } = useDictionary()
  const t = (
    (dictionary?.school as Record<string, unknown> | undefined)?.teachers as
      | Record<string, unknown>
      | undefined
  )?.subjectsEditor as Labels | undefined

  const [data, setData] = useState<TeacherEditorData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [shownGrades, setShownGrades] = useState<Set<string>>(new Set())
  const [residual, setResidual] = useState<AssignmentSummary["residual"]>([])
  const [isPending, startTransition] = useTransition()

  const takePrefetched = useTakePrefetchedSubjects()
  const load = useCallback(async () => {
    // First load in the wizard was started when it opened (prefetch.tsx).
    const res = await (takePrefetched(teacherId) ??
      getTeacherSubjects(teacherId))
    if (!res.success || !res.data) {
      setLoadError(actionErrorMessage(res.error, dictionary, "Failed to load"))
      return
    }
    const d = res.data
    const mine = new Set(
      Object.entries(d.holders)
        .filter(([, h]) => h?.teacherId === teacherId)
        .map(([k]) => k)
    )
    // Show the grades the teacher already teaches in, else the grades of
    // the subjects they're qualified for.
    const grades = new Set<string>()
    for (const g of d.grades) {
      const teachesHere = g.sections.some((s) =>
        g.subjects.some((sub) => mine.has(key(s.sectionId, sub.subjectId)))
      )
      const qualifiedHere = g.subjects.some((sub) =>
        d.teacher.subjectIds.includes(sub.subjectId)
      )
      if (teachesHere || (mine.size === 0 && qualifiedHere))
        grades.add(g.gradeId)
    }
    setData(d)
    setSelected(mine)
    setShownGrades(grades)
    setLoadError(null)
  }, [teacherId, dictionary, takePrefetched])

  useEffect(() => {
    void load()
  }, [load])

  const original = useMemo(
    () =>
      new Set(
        Object.entries(data?.holders ?? {})
          .filter(([, h]) => h?.teacherId === teacherId)
          .map(([k]) => k)
      ),
    [data, teacherId]
  )

  // Projected weekly load: what the edit adds minus what it frees.
  const projected = useMemo(() => {
    if (!data) return 0
    let load = data.teacher.load
    for (const k of original) {
      if (!selected.has(k)) load -= data.cells[k]?.taught ?? 0
    }
    for (const k of selected) {
      if (!original.has(k)) load += data.cells[k]?.scheduled ?? 0
    }
    return Math.max(0, load)
  }, [data, original, selected])

  const toggleSubject = (sectionIds: string[], subjectId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const keys = sectionIds.map((s) => key(s, subjectId))
      const anyOn = keys.some((k) => next.has(k))
      if (anyOn) {
        keys.forEach((k) => next.delete(k))
      } else {
        // Free sections (and ones already this teacher's) come with the
        // subject; a section someone else teaches needs its own click.
        for (const k of keys) {
          const holder = data?.holders[k]
          if (!holder || holder.teacherId === teacherId) next.add(k)
        }
      }
      return next
    })
  }

  const toggleSection = (k: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  const save = useCallback(
    (overrideCap = false): Promise<void> =>
      new Promise((resolve, reject) => {
        // Nothing changed (e.g. Next in the wizard): no write, no toast.
        if (
          selected.size === original.size &&
          [...selected].every((k) => original.has(k))
        ) {
          resolve()
          return
        }
        startTransition(async () => {
          const pairs = [...selected].map((k) => {
            const [sectionId, subjectId] = k.split(":")
            return { sectionId, subjectId }
          })
          const res = await saveTeacherSubjects({
            teacherId,
            pairs,
            overrideCap,
          })
          if (!res.success || !res.data) {
            if (res.error === "TEACHER_OVER_CAP" && !overrideCap) {
              const [loadNow, cap] = (res.details ?? "").split("/")
              const go = await confirmDeleteDialog(undefined, {
                title: t?.overCapTitle ?? "Over the weekly limit",
                description: fill(
                  t?.overCapBody ??
                    "This gives the teacher {load} periods a week; the limit is {cap}. Assign anyway?",
                  { load: loadNow ?? "?", cap: cap ?? "?" }
                ),
                confirmText: t?.assignAnyway ?? "Assign anyway",
                cancelText: t?.cancel ?? "Cancel",
              })
              if (go) {
                save(true).then(resolve, reject)
              } else {
                reject(new Error("cancelled"))
              }
              return
            }
            ErrorToast(
              actionErrorMessage(res.error, dictionary, "Failed to save")
            )
            reject(new Error(res.error))
            return
          }
          const summary = res.data
          setResidual(summary.residual)
          SuccessToast(
            summary.assigned > 0 || summary.moved > 0
              ? fill(
                  t?.saved ??
                    "Saved — {assigned} periods assigned, {moved} moved to make room.",
                  { assigned: summary.assigned, moved: summary.moved }
                )
              : (t?.savedNoChange ?? "Saved.")
          )
          onSaved?.(summary)
          await load()
          resolve()
        })
      }),
    [selected, original, teacherId, t, dictionary, onSaved, load]
  )

  useImperativeHandle(ref, () => ({ saveAndNext: () => save() }), [save])

  if (loadError) {
    return <p className="text-destructive text-sm">{loadError}</p>
  }
  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (data.grades.every((g) => g.subjects.length === 0)) {
    return (
      <p className="text-muted-foreground text-sm">
        {t?.noSubjects ??
          "This school hasn't chosen subjects for its grades yet."}
      </p>
    )
  }

  const cap = data.teacher.cap
  const over = projected > cap
  const days = t?.days ?? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-6">
      {/* Grade filter */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">
          {t?.gradesHint ?? "Show the grades this teacher teaches in"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {data.grades.map((g) => (
            <button
              key={g.gradeId}
              type="button"
              disabled={isPending}
              onClick={() =>
                setShownGrades((prev) => {
                  const next = new Set(prev)
                  if (next.has(g.gradeId)) next.delete(g.gradeId)
                  else next.add(g.gradeId)
                  return next
                })
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                shownGrades.has(g.gradeId)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 hover:bg-muted border-border"
              )}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {shownGrades.size === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t?.noGrades ?? "Pick a grade to see its subjects."}
        </p>
      ) : (
        data.grades
          .filter((g) => shownGrades.has(g.gradeId))
          .map((g) => (
            <section key={g.gradeId} className="space-y-2">
              <h4 className="text-sm font-semibold">{g.name}</h4>
              <ul className="divide-border divide-y rounded-lg border">
                {g.subjects.map((sub) => {
                  const keys = g.sections.map((s) =>
                    key(s.sectionId, sub.subjectId)
                  )
                  const on = keys.filter((k) => selected.has(k)).length
                  const state =
                    on === 0
                      ? false
                      : on === keys.length
                        ? true
                        : "indeterminate"
                  return (
                    <li
                      key={sub.subjectId}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2"
                    >
                      <label className="flex min-w-44 flex-1 cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={state}
                          disabled={isPending}
                          onCheckedChange={() =>
                            toggleSubject(
                              g.sections.map((s) => s.sectionId),
                              sub.subjectId
                            )
                          }
                        />
                        <span className="font-medium">{sub.name}</span>
                        {sub.weeklyPeriods > 0 && (
                          <span className="text-muted-foreground text-xs">
                            {fill(t?.perWeek ?? "{count}/wk", {
                              count: sub.weeklyPeriods,
                            })}
                          </span>
                        )}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {g.sections.map((s) => {
                          const k = key(s.sectionId, sub.subjectId)
                          const holder = data.holders[k]
                          const otherHolder =
                            holder && holder.teacherId !== teacherId
                              ? holder
                              : null
                          const isOn = selected.has(k)
                          return (
                            <button
                              key={s.sectionId}
                              type="button"
                              title={s.name}
                              disabled={isPending}
                              onClick={() => toggleSection(k)}
                              className={cn(
                                "rounded-md border px-2 py-0.5 text-xs transition-colors",
                                isOn
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-muted border-border",
                                otherHolder && !isOn && "border-dashed"
                              )}
                            >
                              {s.letter || s.name}
                              {otherHolder && !isOn && (
                                <span className="text-muted-foreground ms-1">
                                  {fill(t?.takenBy ?? "{name}", {
                                    name: otherHolder.name,
                                  })}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
      )}

      {/* Weekly load */}
      <div className="space-y-1.5">
        <div
          className={cn(
            "text-sm",
            over ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {fill(t?.load ?? "{load} of {cap} periods a week", {
            load: projected,
            cap,
          })}
        </div>
        <Progress
          value={Math.min(100, cap > 0 ? (projected / cap) * 100 : 0)}
          className={cn("h-1.5", over && "[&>div]:bg-destructive")}
        />
      </div>

      {residual.length > 0 && (
        <Alert>
          <AlertTitle>
            {t?.residualTitle ?? "Some periods couldn't be placed"}
          </AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              {t?.residualBody ??
                "The teacher is busy at these times and no swap fit. Move them from the timetable."}
            </p>
            <ul className="space-y-0.5 text-xs">
              {residual.map((r, i) => (
                <li key={i}>
                  {r.sectionName} · {days[r.dayOfWeek] ?? r.dayOfWeek} ·{" "}
                  {r.periodName} — {t?.reasons?.[r.reason] ?? r.reason}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {showSaveButton && (
        <div className="flex justify-end">
          <Button disabled={isPending} onClick={() => save().catch(() => {})}>
            {t?.save ?? "Save"}
          </Button>
        </div>
      )}
    </div>
  )
})
