"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useRef, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
      return dict.primarySchool || "Primary School (Grades 1-6)"
    case "secondary":
      return dict.secondarySchool || "Secondary School (Grades 7-12)"
    case "both":
      return dict.fullSchool || "Full School (Grades 1-12)"
    default:
      return dict.fullSchool || "Full School (Grades 1-12)"
  }
}

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
  const [isPending, startTransition] = useTransition()
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

  const handleSubmit = (data: CapacityFormData) => {
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
      } catch (err) {
        setError("An unexpected error occurred")
      }
    })
  }

  const debouncedSave = useCallback(
    (data: CapacityFormData) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        handleSubmit(data)
      }, 500)
    },
    [] // handleSubmit is stable within the component
  )

  const updateField = (
    field: keyof CapacityFormData,
    delta: number,
    min: number,
    max: number
  ) => {
    const currentValue = form.getValues(field)
    const newValue = Math.min(max, Math.max(min, currentValue + delta))
    form.setValue(field, newValue)

    const updatedData = form.getValues()
    debouncedSave(updatedData)
  }

  const teachers = form.watch("teachers")
  const sectionsPerGrade = form.watch("sectionsPerGrade")
  const studentsPerSection = form.watch("studentsPerSection")

  const gradeCount = useMemo(() => getGradeCount(schoolLevel), [schoolLevel])
  const totalClassrooms = gradeCount * sectionsPerGrade
  const totalCapacity = totalClassrooms * studentsPerSection
  const levelLabel = useMemo(
    () => getSchoolLevelLabel(schoolLevel, dict),
    [schoolLevel, dict]
  )

  const CounterRow = ({
    label,
    field,
    step,
    minValue,
    maxValue,
    padDigits,
  }: {
    label: string
    field: keyof CapacityFormData
    step: number
    minValue: number
    maxValue: number
    padDigits: number
  }) => {
    const value = form.watch(field)

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
            onClick={() => updateField(field, -step, minValue, maxValue)}
            disabled={value <= minValue || isPending}
            className={cn(
              "flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full border transition-colors sm:h-7 sm:min-h-[28px] sm:w-7",
              value <= minValue && "cursor-not-allowed opacity-50"
            )}
          >
            <Icons.minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </Button>
          <span className="w-16 text-center font-mono text-lg font-medium sm:text-base">
            {value.toString().padStart(padDigits, "0")}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField(field, step, minValue, maxValue)}
            disabled={value >= maxValue || isPending}
            className={cn(
              "flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full border transition-colors sm:h-7 sm:min-h-[28px] sm:w-7",
              value >= maxValue && "cursor-not-allowed opacity-50"
            )}
          >
            <Icons.plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

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
            label={dict.teachers || "Teachers"}
            field="teachers"
            step={1}
            minValue={1}
            maxValue={500}
            padDigits={4}
          />
          <CounterRow
            label={dict.sectionsPerGrade || "Sections per Grade"}
            field="sectionsPerGrade"
            step={1}
            minValue={1}
            maxValue={10}
            padDigits={2}
          />
          <CounterRow
            label={dict.studentsPerSection || "Students per Section"}
            field="studentsPerSection"
            step={5}
            minValue={10}
            maxValue={60}
            padDigits={4}
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
