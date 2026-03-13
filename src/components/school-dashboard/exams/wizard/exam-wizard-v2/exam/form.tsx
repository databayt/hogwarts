"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import {
  getClassOptions,
  getSubjectOptions,
  updateExamDetails,
} from "./actions"
import { examDetailsSchema, type ExamDetailsFormData } from "./validation"

interface ExamFormProps {
  generatedExamId: string
  initialData?: Partial<ExamDetailsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ExamForm = forwardRef<WizardFormRef, ExamFormProps>(
  ({ generatedExamId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [classOptions, setClassOptions] = useState<
      { label: string; value: string }[]
    >([])
    const [subjectOptions, setSubjectOptions] = useState<
      { label: string; value: string }[]
    >([])

    const form = useForm<ExamDetailsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(examDetailsSchema) as any,
      defaultValues: {
        title: initialData?.title || "",
        classId: initialData?.classId || "",
        subjectId: initialData?.subjectId || "",
        examDate: initialData?.examDate,
        startTime: initialData?.startTime || "09:00",
        duration: initialData?.duration ?? 60,
        totalMarks: initialData?.totalMarks ?? 100,
        passingMarks: initialData?.passingMarks ?? 40,
      },
    })

    // Load class and subject options
    useEffect(() => {
      let mounted = true
      Promise.all([getClassOptions(), getSubjectOptions()]).then(
        ([classResult, subjectResult]) => {
          if (!mounted) return
          if (classResult.success && classResult.data) {
            setClassOptions(
              classResult.data.map((c) => ({ label: c.name, value: c.id }))
            )
          }
          if (subjectResult.success && subjectResult.data) {
            setSubjectOptions(
              subjectResult.data.map((s) => ({
                label: s.subjectName,
                value: s.id,
              }))
            )
          }
        }
      )
      return () => {
        mounted = false
      }
    }, [])

    // Notify parent of validity changes
    const title = form.watch("title")
    const classId = form.watch("classId")
    const subjectId = form.watch("subjectId")
    const examDate = form.watch("examDate")
    useEffect(() => {
      const isValid = !!title && !!classId && !!subjectId && !!examDate
      onValidChange?.(isValid)
    }, [title, classId, subjectId, examDate, onValidChange])

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
          <InputField
            name="title"
            label="Exam Title"
            placeholder="e.g. Midterm Mathematics Exam"
            required
            disabled={isPending}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <SelectField
              name="classId"
              label="Class"
              options={classOptions}
              required
              disabled={isPending}
            />
            <SelectField
              name="subjectId"
              label="Subject"
              options={subjectOptions}
              required
              disabled={isPending}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
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
              disabled={isPending}
            />
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <InputField
              name="duration"
              label="Duration (min)"
              type="number"
              placeholder="60"
              required
              disabled={isPending}
            />
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
          </div>
        </form>
      </Form>
    )
  }
)

ExamForm.displayName = "ExamForm"
