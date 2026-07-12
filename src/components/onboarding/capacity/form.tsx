"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useController, useForm, useWatch, type Control } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Icons } from "@/components/icons"

import { updateSchoolCapacity } from "./actions"
import { capacitySchema, type CapacityFormData } from "./validation"

function getGradeCount(schoolLevel: string): number {
  switch (schoolLevel) {
    case "primary":
      return 6
    case "middle":
      return 3
    case "secondary":
      return 6
    case "both":
      return 12
    default:
      return 12
  }
}

function getSchoolLevelLabel(
  schoolLevel: string,
  dict: Record<string, string>
): string {
  switch (schoolLevel) {
    case "primary":
      return dict.primarySchool || "Elementary School (Grades 1-6)"
    case "middle":
      return dict.middleSchool || "Middle School (Grades 7-9)"
    case "secondary":
      return dict.secondarySchool || "High School (Grades 10-12)"
    case "both":
      return dict.fullSchool || "Full School (Grades 1-12)"
    default:
      return dict.fullSchool || "Full School (Grades 1-12)"
  }
}

/**
 * A single stepper row. Defined at module scope (NOT inside CapacityForm) so its
 * component identity is stable across parent re-renders — otherwise React would
 * unmount/remount every row on each keystroke, which is the "flash" all three
 * counters showed when one was clicked. `useController` subscribes this row to
 * ONLY its own field, so incrementing one counter never re-renders the others.
 */
const CounterRow = memo(function CounterRow({
  control,
  name,
  label,
  step,
  min,
  max,
  onCommit,
}: {
  control: Control<CapacityFormData>
  name: keyof CapacityFormData
  label: string
  step: number
  min: number
  max: number
  onCommit: () => void
}) {
  const { field } = useController({ control, name })
  const value = (field.value as number) ?? min

  const commit = useCallback(
    (raw: number) => {
      const next = Math.min(max, Math.max(min, raw))
      field.onChange(next)
      onCommit()
    },
    [field, min, max, onCommit]
  )

  const atMin = value <= min
  const atMax = value >= max

  return (
    <div className="border-border flex items-center justify-between border-b py-4 last:border-b-0 sm:py-6">
      <div className="text-foreground text-sm font-medium sm:text-base">
        {label}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => commit(value - step)}
          disabled={atMin}
          aria-label={`decrease ${label}`}
          className={cn(
            "flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full border transition-colors active:scale-95 sm:h-7 sm:min-h-[28px] sm:w-7",
            atMin && "cursor-not-allowed opacity-50"
          )}
        >
          <Icons.minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </Button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === "") {
              field.onChange(min)
              return
            }
            const parsed = parseInt(raw, 10)
            if (Number.isFinite(parsed)) commit(parsed)
          }}
          onBlur={() => commit(value)}
          className="focus:ring-primary w-16 [appearance:textfield] rounded-md border-none bg-transparent text-center font-mono text-lg font-medium tabular-nums outline-none focus:ring-2 sm:text-base [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => commit(value + step)}
          disabled={atMax}
          aria-label={`increase ${label}`}
          className={cn(
            "flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full border transition-colors active:scale-95 sm:h-7 sm:min-h-[28px] sm:w-7",
            atMax && "cursor-not-allowed opacity-50"
          )}
        >
          <Icons.plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </Button>
      </div>
    </div>
  )
})

interface CapacityFormProps {
  schoolId: string
  initialData?: Partial<CapacityFormData>
  schoolLevel: string
  onSuccess?: () => void
  dictionary?: any
}

export function CapacityForm({
  schoolId,
  initialData,
  schoolLevel,
  onSuccess,
  dictionary,
}: CapacityFormProps) {
  const dict = dictionary?.onboarding || {}
  // Keep the transition for the background save, but don't read `isPending`:
  // toggling it disabled the whole control set mid-save, which flickered the
  // counters on every step. The save stays off the interaction's critical path.
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string>("")

  const form = useForm<CapacityFormData>({
    resolver: zodResolver(capacitySchema),
    defaultValues: {
      teachers: initialData?.teachers || 10,
      sectionsPerGrade: initialData?.sectionsPerGrade || 2,
      studentsPerSection: initialData?.studentsPerSection || 30,
    },
  })

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSubmit = useCallback(
    (data: CapacityFormData) => {
      startTransition(async () => {
        try {
          setError("")
          const result = await updateSchoolCapacity(schoolId, data)

          if (result.success) {
            onSuccess?.()
          } else {
            setError(result.error || "Failed to update capacity")
            if (result.errors) {
              Object.entries(result.errors).forEach(([field, message]) => {
                form.setError(field as keyof CapacityFormData, { message })
              })
            }
          }
        } catch {
          setError("An unexpected error occurred")
        }
      })
    },
    [schoolId, onSuccess, form, startTransition]
  )

  // Stable across renders — CounterRow reads the latest values via getValues at
  // fire time, so the debounce closure never goes stale.
  const handleCommit = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      handleSubmit(form.getValues())
    }, 500)
  }, [handleSubmit, form])

  // Only the summary depends on all three values, so it lives here. The rows
  // themselves subscribe individually inside CounterRow.
  const [teachers, sectionsPerGrade, studentsPerSection] = useWatch({
    control: form.control,
    name: ["teachers", "sectionsPerGrade", "studentsPerSection"],
  })

  const gradeCount = useMemo(() => getGradeCount(schoolLevel), [schoolLevel])
  const totalClassrooms = gradeCount * (sectionsPerGrade ?? 0)
  const totalCapacity = totalClassrooms * (studentsPerSection ?? 0)
  const levelLabel = useMemo(
    () => getSchoolLevelLabel(schoolLevel, dict),
    [schoolLevel, dict]
  )

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-background">
          <CounterRow
            control={form.control}
            name="teachers"
            label={dict.teachers || "Teachers"}
            step={1}
            min={1}
            max={500}
            onCommit={handleCommit}
          />
          <CounterRow
            control={form.control}
            name="sectionsPerGrade"
            label={dict.sectionsPerGrade || "Sections per Grade"}
            step={1}
            min={1}
            max={10}
            onCommit={handleCommit}
          />
          <CounterRow
            control={form.control}
            name="studentsPerSection"
            label={dict.studentsPerSection || "Students per Section"}
            step={1}
            min={1}
            max={60}
            onCommit={handleCommit}
          />
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            {levelLabel}
          </p>
          <div className="text-foreground space-y-1 text-sm">
            <p>
              {gradeCount} {dict.grades || "grades"} × {sectionsPerGrade}{" "}
              {dict.sections || "sections"} ={" "}
              <strong>
                {totalClassrooms} {dict.classrooms || "classrooms"}
              </strong>
            </p>
            <p>
              {totalClassrooms} {dict.classrooms || "classrooms"} ×{" "}
              {studentsPerSection} {dict.students || "students"} ={" "}
              <strong>
                {totalCapacity.toLocaleString()} {dict.capacity || "capacity"}
              </strong>
            </p>
          </div>
        </div>
      </form>
    </Form>
  )
}
