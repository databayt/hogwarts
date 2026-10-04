"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { TeachingScopePicker } from "@/components/school-dashboard/teaching-scope/picker"
import type { TeachingScopeValue } from "@/components/school-dashboard/teaching-scope/validation"

import { updateExamDetails } from "./actions"
import { examDetailsSchema, type ExamDetailsFormData } from "./validation"

interface ExamFormProps {
  generatedExamId: string
  /** The template's subject, when the exam was built from one. */
  fixedSubjectId?: string
  initialData?: Partial<ExamDetailsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ExamForm = forwardRef<WizardFormRef, ExamFormProps>(
  ({ generatedExamId, fixedSubjectId, initialData, onValidChange }, ref) => {
    const { dictionary } = useDictionary()
    const t = dictionary?.school?.exams?.wizard?.examWizard?.exam
    const [isPending, startTransition] = useTransition()

    const form = useForm<ExamDetailsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(examDetailsSchema) as any,
      defaultValues: {
        title: initialData?.title || "",
        gradeId: initialData?.gradeId || "",
        sectionId: initialData?.sectionId ?? null,
        subjectId: initialData?.subjectId || "",
        examDate: initialData?.examDate,
        startTime: initialData?.startTime || "09:00",
        duration: initialData?.duration ?? 60,
        totalMarks: initialData?.totalMarks ?? 100,
        passingMarks: initialData?.passingMarks ?? 40,
      },
    })

    // Notify parent of validity changes
    const title = form.watch("title")
    const gradeId = form.watch("gradeId")
    const sectionId = form.watch("sectionId")
    const subjectId = form.watch("subjectId")
    const examDate = form.watch("examDate")
    useEffect(() => {
      const isValid = !!title && !!gradeId && !!subjectId && !!examDate
      onValidChange?.(isValid)
    }, [title, gradeId, subjectId, examDate, onValidChange])

    const setScope = useCallback(
      (scope: TeachingScopeValue) => {
        const opts = { shouldValidate: true, shouldDirty: true }
        form.setValue("gradeId", scope.gradeId, opts)
        form.setValue("sectionId", scope.sectionId, opts)
        form.setValue("subjectId", scope.subjectId, opts)
      },
      [form]
    )

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
              const result = await updateExamDetails(generatedExamId, data)
              if (!result.success) {
                ErrorToast(
                  actionErrorMessage(
                    result.error,
                    dictionary,
                    t?.saveError || "Failed to save"
                  )
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : t?.saveError || "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <InputField
            name="title"
            label={t?.examTitle ?? "Exam Title"}
            placeholder={t?.titlePlaceholder ?? "e.g. Midterm Mathematics Exam"}
            required
            disabled={isPending}
          />
          <TeachingScopePicker
            value={{ gradeId, sectionId, subjectId }}
            onChange={setScope}
            subjectId={fixedSubjectId}
            disabled={isPending}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <DateField
              name="examDate"
              label={t?.examDate ?? "Exam Date"}
              required
              disabled={isPending}
            />
            <InputField
              name="startTime"
              label={t?.startTime ?? "Start Time"}
              type="time"
              disabled={isPending}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <InputField
              name="duration"
              label={t?.duration ?? "Duration (min)"}
              type="number"
              placeholder="60"
              required
              disabled={isPending}
            />
            <InputField
              name="totalMarks"
              label={t?.totalMarks ?? "Total Marks"}
              type="number"
              placeholder="100"
              required
              disabled={isPending}
            />
            <InputField
              name="passingMarks"
              label={t?.passingMarks ?? "Passing Marks"}
              type="number"
              placeholder="40"
              required
              disabled={isPending}
            />
          </div>
        </form>
      </Form>
    )
  }
)

ExamForm.displayName = "ExamForm"
