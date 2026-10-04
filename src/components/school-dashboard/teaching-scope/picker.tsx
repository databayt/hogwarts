"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useId, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getTeachingScopeOptions, type TeachingScopeGrade } from "./actions"
import type { TeachingScopeValue } from "./validation"

/** Radix Select can't hold an empty value; this stands for "the whole grade". */
const WHOLE_GRADE = "__whole_grade__"

interface TeachingScopePickerProps {
  value: TeachingScopeValue
  onChange: (value: TeachingScopeValue) => void
  /**
   * A subject fixed by the caller (a catalog exam's, a template's): grades
   * that don't teach it are hidden and no subject choice is shown.
   */
  subjectId?: string
  disabled?: boolean
  className?: string
}

/**
 * Grade → one section or the whole grade → subject. Replaces the "class"
 * pickers: work is set for sections of a grade, never for a class.
 */
export function TeachingScopePicker({
  value,
  onChange,
  subjectId,
  disabled,
  className,
}: TeachingScopePickerProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.teachingScope
  const id = useId()
  const [grades, setGrades] = useState<TeachingScopeGrade[] | null>(null)

  useEffect(() => {
    let alive = true
    getTeachingScopeOptions().then((res) => {
      if (alive) setGrades(res.success && res.data ? res.data.grades : [])
    })
    return () => {
      alive = false
    }
  }, [])

  const eligible = useMemo(
    () =>
      (grades ?? []).filter((g) =>
        subjectId
          ? g.subjects.some((s) => s.id === subjectId)
          : g.subjects.length > 0
      ),
    [grades, subjectId]
  )
  const grade = eligible.find((g) => g.id === value.gradeId)

  // A fixed subject taught in exactly one grade leaves nothing to choose.
  useEffect(() => {
    if (subjectId && !value.gradeId && eligible.length === 1) {
      onChange({ gradeId: eligible[0].id, sectionId: null, subjectId })
    }
  }, [subjectId, value.gradeId, eligible, onChange])

  if (grades === null) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
    )
  }

  if (eligible.length === 0) {
    return (
      <p className={cn("text-muted-foreground text-sm", className)}>
        {subjectId ? t?.noGradesForSubject : t?.noGrades}
      </p>
    )
  }

  const pickGrade = (gradeId: string) => {
    const next = eligible.find((g) => g.id === gradeId)
    const keep = next?.subjects.some((s) => s.id === value.subjectId)
    onChange({
      gradeId,
      sectionId: null,
      subjectId: subjectId ?? (keep ? value.subjectId : ""),
    })
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        subjectId ? "sm:grid-cols-2" : "sm:grid-cols-3",
        className
      )}
    >
      <div className="space-y-2">
        <Label htmlFor={`${id}-grade`}>{t?.grade}</Label>
        <Select
          value={grade ? grade.id : ""}
          onValueChange={pickGrade}
          disabled={disabled}
        >
          <SelectTrigger id={`${id}-grade`} className="w-full">
            <SelectValue placeholder={t?.selectGrade} />
          </SelectTrigger>
          <SelectContent>
            {eligible.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}-section`}>{t?.section}</Label>
        <Select
          value={value.sectionId ?? WHOLE_GRADE}
          onValueChange={(v) =>
            onChange({ ...value, sectionId: v === WHOLE_GRADE ? null : v })
          }
          disabled={disabled || !grade}
        >
          <SelectTrigger id={`${id}-section`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={WHOLE_GRADE}>{t?.wholeGrade}</SelectItem>
            {(grade?.sections ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!subjectId && (
        <div className="space-y-2">
          <Label htmlFor={`${id}-subject`}>{t?.subject}</Label>
          <Select
            value={
              grade?.subjects.some((s) => s.id === value.subjectId)
                ? value.subjectId
                : ""
            }
            onValueChange={(v) => onChange({ ...value, subjectId: v })}
            disabled={disabled || !grade}
          >
            <SelectTrigger id={`${id}-subject`} className="w-full">
              <SelectValue placeholder={t?.selectSubject} />
            </SelectTrigger>
            <SelectContent>
              {(grade?.subjects ?? []).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
