"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subjects & sections editor — one teacher's specialties and teaching
 * assignments.
 *
 * Shared by the Add Teacher wizard step and the teachers row-action dialog.
 * A specialty is a subject FAMILY — every grade's subject of the same name.
 * Catalog subjects are per grade (sd-g4-math), so starring Math qualifies the
 * teacher for Math in every grade. (Catalog `concept` is too coarse for this:
 * "language" holds Arabic and French, "faith" Islamic and Christian studies.) The filter shows the teacher's specialties (default)
 * or all subjects, across all grades or one. Tick a card (every free section
 * of that grade comes with it), adjust single sections. A section someone
 * else teaches is dashed and stays unticked unless clicked, which hands it
 * over. Saving writes the specialties and the timetable: the teacher's
 * periods fill in, moving others inside the section when needed
 * (timetable/assignments).
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { Check, Star } from "lucide-react"

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

type Grade = TeacherEditorData["grades"][number]
type Subject = Grade["subjects"][number]

/** A teacher's specialty is the subject family: same name across grades. */
const familyOf = (sub: Subject) => sub.name.trim()

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
  /** Specialty families (see familyOf). */
  const [families, setFamilies] = useState<Set<string>>(new Set())
  /** "mine" = the teacher's specialties; "all" = every subject. */
  const [scope, setScope] = useState<"mine" | "all">("mine")
  /** null = all grades. */
  const [gradeFilter, setGradeFilter] = useState<string | null>(null)
  const [residual, setResidual] = useState<AssignmentSummary["residual"]>([])
  const [isPending, startTransition] = useTransition()
  const initialized = useRef(false)

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
    const fams = familiesOf(d, d.teacher.subjectIds)
    setData(d)
    setSelected(mine)
    setFamilies(fams)
    setLoadError(null)
    // A reload after saving keeps the admin's filter.
    if (!initialized.current) {
      initialized.current = true
      if (fams.size > 0) {
        setScope("mine")
        setGradeFilter(null)
      } else {
        // No specialty yet: every subject, one grade at a time — the first
        // grade the teacher teaches in, else the first with subjects.
        setScope("all")
        const teaches = (g: Grade) =>
          g.sections.some((s) =>
            g.subjects.some((sub) => mine.has(key(s.sectionId, sub.subjectId)))
          )
        const first =
          d.grades.find(teaches) ?? d.grades.find((g) => g.subjects.length > 0)
        setGradeFilter(first?.gradeId ?? null)
      }
    }
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
  const originalFamilies = useMemo(
    () =>
      data ? familiesOf(data, data.teacher.subjectIds) : new Set<string>(),
    [data]
  )

  // Every subject the school teaches, by id.
  const subjectById = useMemo(() => {
    const byId = new Map<string, Subject>()
    for (const g of data?.grades ?? []) {
      for (const sub of g.subjects) byId.set(sub.subjectId, sub)
    }
    return byId
  }, [data])

  // Families the teacher teaches right now can't be un-starred.
  const teachingFamilies = useMemo(() => {
    const out = new Set<string>()
    for (const k of selected) {
      const sub = subjectById.get(k.split(":")[1])
      if (sub) out.add(familyOf(sub))
    }
    return out
  }, [selected, subjectById])

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

  // The cards on show. Ordered on the SAVED state (what the teacher teaches,
  // their specialties, where sections are still free) so a card doesn't jump
  // while the admin clicks it.
  const cards = useMemo(() => {
    if (!data) return []
    const grades = gradeFilter
      ? data.grades.filter((g) => g.gradeId === gradeFilter)
      : data.grades
    const out: Array<{
      grade: Grade
      sub: Subject
      keys: string[]
      held: boolean
      special: boolean
      free: number
    }> = []
    for (const grade of grades) {
      for (const sub of grade.subjects) {
        const keys = grade.sections.map((s) => key(s.sectionId, sub.subjectId))
        const fam = familyOf(sub)
        const held = keys.some((k) => original.has(k))
        const visible =
          scope === "all" ||
          families.has(fam) ||
          keys.some((k) => selected.has(k))
        if (!visible) continue
        out.push({
          grade,
          sub,
          keys,
          held,
          special: originalFamilies.has(fam),
          free: keys.filter((k) => !data.holders[k]).length,
        })
      }
    }
    return out
      .map((c, i) => ({ c, i }))
      .sort(
        (a, b) =>
          Number(b.c.held) - Number(a.c.held) ||
          Number(b.c.special) - Number(a.c.special) ||
          Number(b.c.free > 0) - Number(a.c.free > 0) ||
          a.i - b.i
      )
      .map(({ c }) => c)
  }, [data, gradeFilter, scope, families, selected, original, originalFamilies])

  const addFamily = (sub: Subject) =>
    setFamilies((prev) =>
      prev.has(familyOf(sub)) ? prev : new Set(prev).add(familyOf(sub))
    )

  const toggleFamily = (sub: Subject) => {
    const fam = familyOf(sub)
    if (teachingFamilies.has(fam)) return
    setFamilies((prev) => {
      const next = new Set(prev)
      if (next.has(fam)) next.delete(fam)
      else next.add(fam)
      return next
    })
  }

  const toggleSubject = (keys: string[], sub: Subject) => {
    const anyOn = keys.some((k) => selected.has(k))
    if (!anyOn) addFamily(sub)
    setSelected((prev) => {
      const next = new Set(prev)
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

  const toggleSection = (k: string, sub: Subject) => {
    if (!selected.has(k)) addFamily(sub)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  /**
   * Expertise rows to save: every subject of every starred family, plus
   * expertise in subjects the school no longer offers (kept untouched).
   */
  const specialtyIds = useCallback(() => {
    const ids = [...subjectById.values()]
      .filter((sub) => families.has(familyOf(sub)))
      .map((sub) => sub.subjectId)
    const kept = (data?.teacher.subjectIds ?? []).filter(
      (id) => !subjectById.has(id)
    )
    return [...ids, ...kept]
  }, [subjectById, families, data])

  const save = useCallback(
    (overrideCap = false): Promise<void> =>
      new Promise((resolve, reject) => {
        // Nothing changed (e.g. Next in the wizard): no write, no toast.
        const sameAssignments =
          selected.size === original.size &&
          [...selected].every((k) => original.has(k))
        const sameFamilies =
          families.size === originalFamilies.size &&
          [...families].every((f) => originalFamilies.has(f))
        if (sameAssignments && sameFamilies) {
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
            specialtyIds: specialtyIds(),
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
    [
      selected,
      original,
      families,
      originalFamilies,
      specialtyIds,
      teacherId,
      t,
      dictionary,
      onSaved,
      load,
    ]
  )

  useImperativeHandle(ref, () => ({ saveAndNext: () => save() }), [save])

  if (loadError) {
    return <p className="text-destructive text-sm">{loadError}</p>
  }
  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <div className="flex gap-2.5">
          <Skeleton className="h-36 w-28" />
          <Skeleton className="h-36 w-28" />
          <Skeleton className="h-36 w-28" />
        </div>
        <Skeleton className="h-4 w-48" />
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
  const shortGrade = (g: Grade) =>
    gradeLabel(g.gradeNumber, {
      lang: locale,
      country: data.gradeCountry,
      form: "short",
    })
  const familyNames = [...families]
  const subjectCount = new Set([...selected].map((k) => k.split(":")[1])).size
  const sectionCount = new Set([...selected].map((k) => k.split(":")[0])).size

  const chip = (active: boolean) =>
    cn(
      "relative shrink-0 rounded-full border px-3 py-1 text-xs font-medium tabular-nums transition-colors",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-muted/50 hover:bg-muted border-border"
    )

  return (
    <div className="space-y-4">
      {/* The teacher's specialties, in words */}
      {familyNames.length > 0 && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Star className="fill-primary text-primary size-3.5 shrink-0" />
          <span className="truncate">{familyNames.join(" · ")}</span>
        </p>
      )}

      {/* Filters: specialty / all subjects, then all grades / one grade */}
      <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 [contain:inline-size]">
        <button
          type="button"
          disabled={isPending}
          onClick={() => setScope("mine")}
          className={cn(chip(scope === "mine"), "flex items-center gap-1")}
        >
          <Star className={cn("size-3", scope === "mine" && "fill-current")} />
          {t?.specialty ?? "Specialty"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setScope("all")}
          className={chip(scope === "all")}
        >
          {t?.allSubjects ?? "All subjects"}
        </button>
        <span className="bg-border mx-1 h-4 w-px shrink-0" />
        <button
          type="button"
          disabled={isPending}
          onClick={() => setGradeFilter(null)}
          className={chip(gradeFilter === null)}
        >
          {t?.allGrades ?? "All grades"}
        </button>
        {data.grades.map((g) => {
          const active = g.gradeId === gradeFilter
          const hasWork = g.sections.some((s) =>
            g.subjects.some((sub) =>
              selected.has(key(s.sectionId, sub.subjectId))
            )
          )
          // In the specialty view, grades with nothing in the specialty fade.
          const relevant =
            scope === "all" ||
            g.subjects.some((sub) => families.has(familyOf(sub)))
          return (
            <button
              key={g.gradeId}
              type="button"
              title={g.name}
              disabled={isPending}
              onClick={() => setGradeFilter(active ? null : g.gradeId)}
              className={cn(
                chip(active),
                "min-w-10",
                !relevant && !active && "opacity-40"
              )}
            >
              {shortGrade(g)}
              {hasWork && !active && (
                <span className="bg-primary absolute -end-0.5 -top-0.5 size-2 rounded-full" />
              )}
            </button>
          )
        })}
      </div>

      {/* Cards — one swipeable row. contain:inline-size keeps the row from
          reporting every card's width as its minimum: as a FormLayout column
          (a shrink-0 flex item) that forced the column wider than its 48% and
          out past the page gutter. Now the row scrolls inside it. */}
      {cards.length === 0 ? (
        <div className="text-muted-foreground flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center text-sm">
          <p>
            {scope === "mine"
              ? (t?.noSpecialty ??
                "No specialty yet. Open All subjects and star what this teacher can teach.")
              : (t?.noGrades ?? "Pick a grade to see its subjects.")}
          </p>
          {scope === "mine" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setScope("all")}
            >
              {t?.showAll ?? "Show all subjects"}
            </Button>
          )}
        </div>
      ) : (
        <div className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1 [contain:inline-size]">
          {cards.map(({ grade, sub, keys }) => {
            const on = keys.filter((k) => selected.has(k)).length
            const all = on > 0 && on === keys.length
            const fam = familyOf(sub)
            const special = families.has(fam)
            const locked = teachingFamilies.has(fam)
            return (
              <div
                key={`${grade.gradeId}:${sub.subjectId}`}
                className={cn(
                  "bg-card relative w-28 shrink-0 snap-start overflow-hidden rounded-xl border transition-[box-shadow,opacity]",
                  all && "ring-primary ring-2",
                  on > 0 && !all && "ring-primary/50 ring-2",
                  !special && on === 0 && "opacity-60 hover:opacity-100"
                )}
              >
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => toggleSubject(keys, sub)}
                  className="block w-full text-start"
                >
                  <div className="bg-muted relative aspect-[3/2] overflow-hidden">
                    <BlurImage
                      src={sub.imageUrl ?? getSubjectImage(sub.name)}
                      alt={sub.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                    {on > 0 && (
                      <span className="bg-primary text-primary-foreground absolute end-1.5 top-1.5 flex size-5 items-center justify-center rounded-full">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="px-2 pt-1.5">
                    <p className="truncate text-xs font-medium">{sub.name}</p>
                    <p className="text-muted-foreground truncate text-[11px] tabular-nums">
                      {[
                        gradeFilter === null ? shortGrade(grade) : null,
                        sub.weeklyPeriods > 0
                          ? fill(t?.perWeek ?? "{count}/wk", {
                              count: sub.weeklyPeriods,
                            })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                </button>

                {/* Specialty star — a family, so it lights every grade's card */}
                <button
                  type="button"
                  disabled={isPending}
                  aria-pressed={special}
                  title={
                    locked
                      ? (t?.specialtyLocked ??
                        "Teaches this subject — it stays a specialty")
                      : special
                        ? (t?.unmarkSpecialty ?? "Remove specialty")
                        : (t?.markSpecialty ?? "Mark as specialty")
                  }
                  onClick={() => toggleFamily(sub)}
                  className="bg-background/80 absolute start-1.5 top-1.5 flex size-5 items-center justify-center rounded-full backdrop-blur"
                >
                  <Star
                    className={cn(
                      "size-3",
                      special
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </button>

                <div className="flex flex-wrap gap-1 px-2 pt-1.5 pb-2">
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
                        onClick={() => toggleSection(k, sub)}
                        className={cn(
                          "min-w-6 rounded-md border px-1 text-[11px] leading-5 transition-colors",
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

      {/* Light counter: what the teacher teaches and the weekly load */}
      <div className="space-y-1.5">
        <p
          className={cn(
            "text-xs tabular-nums",
            over ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {fill(
            t?.counter ??
              "{subjects} subjects · {sections} sections · {load}/{cap} periods",
            {
              subjects: subjectCount,
              sections: sectionCount,
              load: projected,
              cap,
            }
          )}
        </p>
        <Progress
          value={Math.min(100, cap > 0 ? (projected / cap) * 100 : 0)}
          className={cn("h-1", over && "[&>div]:bg-destructive")}
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

/** The specialty families of a set of subject ids (ids the school no longer offers drop out). */
function familiesOf(d: TeacherEditorData, subjectIds: string[]): Set<string> {
  const ids = new Set(subjectIds)
  const out = new Set<string>()
  for (const g of d.grades) {
    for (const sub of g.subjects) {
      if (ids.has(sub.subjectId)) out.add(familyOf(sub))
    }
  }
  return out
}
