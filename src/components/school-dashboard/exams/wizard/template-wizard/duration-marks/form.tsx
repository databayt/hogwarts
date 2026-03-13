"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { NumberField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateTemplateDurationMarks } from "./actions"
import { durationMarksSchema, type DurationMarksFormData } from "./validation"

interface DurationMarksFormProps {
  templateId: string
  initialData?: Partial<DurationMarksFormData>
  onValidChange?: (isValid: boolean) => void
}

export const DurationMarksForm = forwardRef<
  WizardFormRef,
  DurationMarksFormProps
>(({ templateId, initialData, onValidChange }, ref) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<DurationMarksFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(durationMarksSchema) as any,
    defaultValues: {
      duration: initialData?.duration ?? 60,
      totalMarks: initialData?.totalMarks ?? 100,
    },
  })

  // Notify parent of validity changes
  const duration = form.watch("duration")
  const totalMarks = form.watch("totalMarks")
  React.useEffect(() => {
    const isValid =
      typeof duration === "number" &&
      duration >= 5 &&
      typeof totalMarks === "number" &&
      totalMarks >= 1
    onValidChange?.(isValid)
  }, [duration, totalMarks, onValidChange])

  useImperativeHandle(ref, () => ({
    saveAndNext: () =>
      new Promise<void>((resolve, reject) => {
        startTransition(async () => {
          try {
            const valid = await form.trigger()
            if (!valid) {
              reject(new Error("Validation failed"))
              return
            }
            const data = form.getValues()
            const result = await updateTemplateDurationMarks(templateId, data)
            if (!result.success) {
              ErrorToast(result.error || "Failed to save")
              reject(new Error(result.error))
              return
            }
            resolve()
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to save"
            ErrorToast(msg)
            reject(err)
          }
        })
      }),
  }))

  return (
    <Form {...form}>
      <form className="space-y-6">
        <NumberField
          name="duration"
          label="Duration (minutes)"
          min={5}
          max={480}
          required
          disabled={isPending}
        />
        <NumberField
          name="totalMarks"
          label="Total Marks"
          min={1}
          max={1000}
          required
          disabled={isPending}
        />
      </form>
    </Form>
  )
})

DurationMarksForm.displayName = "DurationMarksForm"
