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
import { Check } from "lucide-react"

import { gradeLabel } from "@/lib/grade"
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { BlurImage } from "@/components/atom/blur-image"
import {
  confirmDeleteDialog,
  ErrorToast,
  SuccessToast,
} from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import {
  getTeacherSubjects,
  saveTeacherSubjects,
  type AssignmentSummary,
} from "@/components/school-dashboard/timetable/assignments/actions"
import type { TeacherEditorData } from "@/components/school-dashboard/timetable/assignments/queries"

import { getSubjectImage } from "../../subjects/image-map"
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
  const { locale } = useLocale()
  const t = (
    (dictionary?.school as Record<string, unknown> | undefined)?.teachers as
      | Record<string, unknown>
      | undefined
  )?.subjectsEditor as Labels | undefined

  const [data, setData] = useState<TeacherEditorData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeGrade, setActiveGrade] = useState<string | null>(null)
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
    // Open on the first grade the teacher teaches in, else one with a
    // subject they're qualified for, else the first grade with subjects.
    const teaches = (g: TeacherEditorData["grades"][number]) =>
      g.sections.some((s) =>
        g.subjects.some((sub) => mine.has(key(s.sectionId, sub.subjectId)))
      )
    const qualified = (g: TeacherEditorData["grades"][number]) =>
      g.subjects.some((sub) => d.teacher.subjectIds.includes(sub.subjectId))
    const first =
      d.grades.find(teaches) ??
      d.grades.find(qualified) ??
      d.grades.find((g) => g.subjects.length > 0)
    setData(d)
    setSelected(mine)
    // A reload after saving keeps the grade the admin is on.
    setActiveGrade((prev) => prev ?? first?.gradeId ?? null)
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

  const grade =
    data.grades.find((g) => g.gradeId === activeGrade) ?? data.grades[0]
  const cap = data.teacher.cap
  const over = projected > cap
  const days = t?.days ?? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-6">
      {/* Grade picker — one grade at a time; a dot marks grades with work */}
      <div className="flex flex-wrap gap-1.5">
        {data.grades.map((g) => {
          const hasWork = g.sections.some((s) =>
            g.subjects.some((sub) =>
              selected.has(key(s.sectionId, sub.subjectId))
            )
          )
          return (
            <button
              key={g.gradeId}
              type="button"
              title={g.name}
              disabled={isPending}
              onClick={() => setActiveGrade(g.gradeId)}
              className={cn(
                "relative min-w-10 rounded-full border px-3 py-1 text-xs font-medium tabular-nums transition-colors",
                g.gradeId === grade?.gradeId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 hover:bg-muted border-border"
              )}
            >
              {gradeLabel(g.gradeNumber, {
                lang: locale,
                country: data.gradeCountry,
                form: "short",
              })}
              {hasWork && g.gradeId !== grade?.gradeId && (
                <span className="bg-primary absolute -end-0.5 -top-0.5 size-2 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Subjects — one swipeable row of cards. contain:inline-size keeps the
          row from reporting every card's width as its minimum: as a FormLayout
          column (a shrink-0 flex item) that forced the column wider than its
          48% and out past the page gutter. Now the row scrolls inside it. */}
      {grade && (
        <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 [contain:inline-size]">
          {grade.subjects.map((sub) => {
            const keys = grade.sections.map((s) =>
              key(s.sectionId, sub.subjectId)
            )
            const on = keys.filter((k) => selected.has(k)).length
            const all = on > 0 && on === keys.length
            return (
              <div
                key={sub.subjectId}
                className={cn(
                  "bg-card w-36 shrink-0 snap-start overflow-hidden rounded-xl border transition-shadow",
                  all && "ring-primary ring-2",
                  on > 0 && !all && "ring-primary/50 ring-2"
                )}
              >
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    toggleSubject(
                      grade.sections.map((s) => s.sectionId),
                      sub.subjectId
                    )
                  }
                  className="block w-full text-start"
                >
                  <div className="bg-muted relative aspect-[4/3] overflow-hidden">
                    <BlurImage
                      src={sub.imageUrl ?? getSubjectImage(sub.name)}
                      alt={sub.name}
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                    {on > 0 && (
                      <span className="bg-primary text-primary-foreground absolute end-1.5 top-1.5 flex size-5 items-center justify-center rounded-full">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 pt-2">
                    <p className="truncate text-sm font-medium">{sub.name}</p>
                    {sub.weeklyPeriods > 0 && (
                      <p className="text-muted-foreground text-xs">
                        {fill(t?.perWeek ?? "{count}/wk", {
                          count: sub.weeklyPeriods,
                        })}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex flex-wrap gap-1 px-2.5 pt-2 pb-2.5">
                  {grade.sections.map((s) => {
                    const k = key(s.sectionId, sub.subjectId)
                    const holder = data.holders[k]
                    const otherHolder =
                      holder && holder.teacherId !== teacherId ? holder : null
                    const isOn = selected.has(k)
                    return (
                      <button
                        key={s.sectionId}
                        type="button"
                        title={
                          otherHolder && !isOn
                            ? `${s.name} · ${fill(t?.takenBy ?? "{name}", { name: otherHolder.name })}`
                            : s.name
                        }
                        disabled={isPending}
                        onClick={() => toggleSection(k)}
                        className={cn(
                          "min-w-7 rounded-md border px-1.5 py-0.5 text-xs transition-colors",
                          isOn
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border",
                          otherHolder &&
                            !isOn &&
                            "text-muted-foreground border-dashed"
                        )}
                      >
                        {s.letter || s.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
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
