"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardTabs, type WizardTab } from "@/components/form/wizard"

import { updateExamSchedule } from "./actions"
import { scheduleSchema, type ScheduleFormData } from "./validation"

const TABS: WizardTab[] = [
  { id: "schedule", label: "Schedule" },
  { id: "marks", label: "Marks" },
]

interface ScheduleFormProps {
  examId: string
  initialData?: Partial<ScheduleFormData>
  onValidChange?: (isValid: boolean) => void
  onTabChange?: (tabId: string) => void
}

export const ScheduleForm = forwardRef<WizardFormRef, ScheduleFormProps>(
  ({ examId, initialData, onValidChange, onTabChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ScheduleFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(scheduleSchema) as any,
      defaultValues: {
        examDate: initialData?.examDate,
        startTime: initialData?.startTime || "09:00",
        endTime: initialData?.endTime || "10:00",
        duration: initialData?.duration ?? 60,
        totalMarks: initialData?.totalMarks ?? 100,
        passingMarks: initialData?.passingMarks ?? 40,
        instructions: initialData?.instructions || "",
      },
    })

    // Notify parent of validity changes
    const examDate = form.watch("examDate")
    const startTime = form.watch("startTime")
    const endTime = form.watch("endTime")
    const duration = form.watch("duration")
    const totalMarks = form.watch("totalMarks")
    const passingMarks = form.watch("passingMarks")
    React.useEffect(() => {
      const isValid =
        !!examDate &&
        !!startTime &&
        !!endTime &&
        duration >= 1 &&
        totalMarks >= 1 &&
        passingMarks >= 1
      onValidChange?.(isValid)
    }, [
      examDate,
      startTime,
      endTime,
      duration,
      totalMarks,
      passingMarks,
      onValidChange,
    ])

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
              const result = await updateExamSchedule(examId, data)
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
          <WizardTabs tabs={TABS} onTabChange={onTabChange}>
            {(activeTab) =>
              activeTab === "schedule" ? (
                <div className="space-y-6">
                  <DateField
                    name="examDate"
                    label="Exam Date"
                    required
                    disabled={isPending}
                  />
                  <InputField
                    name="startTime"
                    label="Start Time"
                    type="time"
                    required
                    disabled={isPending}
                  />
                  <InputField
                    name="endTime"
                    label="End Time"
                    type="time"
                    required
                    disabled={isPending}
                  />
                  <InputField
                    name="duration"
                    label="Duration (minutes)"
                    type="number"
                    placeholder="60"
                    required
                    disabled={isPending}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <InputField
                    name="totalMarks"
                    label="Total Marks"
                    type="number"
                    placeholder="100"
                    required
                    disabled={isPending}
                  />
                  <InputField
                    name="passingMarks"
                    label="Passing Marks"
                    type="number"
                    placeholder="40"
                    required
                    disabled={isPending}
                  />
                  <TextareaField
                    name="instructions"
                    label="Instructions"
                    placeholder="Enter exam instructions (optional)"
                    disabled={isPending}
                  />
                </div>
              )
            }
          </WizardTabs>
        </form>
      </Form>
    )
  }
)

ScheduleForm.displayName = "ScheduleForm"
