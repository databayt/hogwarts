"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Icons } from "@/components/icons"

import { updateSchoolCapacity } from "./actions"
import { capacitySchema, type CapacityFormData } from "./validation"

interface CapacityFormProps {
  schoolId: string
  initialData?: Partial<CapacityFormData>
  onSuccess?: () => void
  dictionary?: any
}

export function CapacityForm({
  schoolId,
  initialData,
  onSuccess,
  dictionary,
}: CapacityFormProps) {
  const dict = dictionary?.onboarding || {}
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")

  const form = useForm<CapacityFormData>({
    resolver: zodResolver(capacitySchema),
    defaultValues: {
      studentCount: initialData?.studentCount || 400,
      teachers: initialData?.teachers || 10,
      classrooms: initialData?.classrooms || 10,
    },
  })

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

  const updateField = (field: keyof CapacityFormData, delta: number) => {
    const currentValue = form.getValues(field)
    const newValue = Math.max(1, currentValue + delta)
    form.setValue(field, newValue)

    // Auto-save on change
    const updatedData = form.getValues()
    handleSubmit(updatedData)
  }

  const formatNumber = (num: number): string => {
    return num.toString().padStart(4, "0")
  }

  const CounterRow = ({
    label,
    field,
    step = 1,
    minValue = 1,
  }: {
    label: string
    field: keyof CapacityFormData
    step?: number
    minValue?: number
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
            onClick={() => updateField(field, -step)}
            disabled={value <= minValue || isPending}
            className={cn(
              "flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full border transition-colors sm:h-7 sm:min-h-[28px] sm:w-7",
              value <= minValue && "cursor-not-allowed opacity-50"
            )}
          >
            <Icons.minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </Button>
          <span className="w-16 text-center font-mono text-lg font-medium sm:text-base">
            {formatNumber(value)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField(field, step)}
            disabled={isPending}
            className="flex h-10 min-h-[40px] w-10 items-center justify-center rounded-full border transition-colors sm:h-7 sm:min-h-[28px] sm:w-7"
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
            label={dict.students || "Students"}
            field="studentCount"
            step={20}
            minValue={1}
          />
          <CounterRow
            label={dict.teachers || "Teachers"}
            field="teachers"
            step={1}
            minValue={1}
          />
          <CounterRow
            label={dict.classSections || "Class Sections"}
            field="classrooms"
            step={1}
            minValue={1}
          />
        </div>
      </form>
    </Form>
  )
}
