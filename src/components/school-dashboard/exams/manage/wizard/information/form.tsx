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
import { InputField, SelectField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { EXAM_TYPE_OPTIONS } from "@/components/school-dashboard/exams/manage/wizard/config"

import { getClassOptions, getSubjectOptions } from "../actions"
import { updateExamInformation } from "./actions"
import { informationSchema, type InformationFormData } from "./validation"

interface InformationFormProps {
  examId: string
  initialData?: Partial<InformationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ examId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [classOptions, setClassOptions] = useState<
      { label: string; value: string }[]
    >([])
    const [subjectOptions, setSubjectOptions] = useState<
      { label: string; value: string }[]
    >([])

    const form = useForm<InformationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(informationSchema) as any,
      defaultValues: {
        title: initialData?.title || "",
        description: initialData?.description || "",
        classId: initialData?.classId || "",
        subjectId: initialData?.subjectId || "",
        examType: initialData?.examType || "TEST",
      },
    })

    // Load class and subject options
    useEffect(() => {
      async function loadOptions() {
        const [classResult, subjectResult] = await Promise.all([
          getClassOptions(),
          getSubjectOptions(),
        ])
        if (classResult.success && classResult.data) {
          setClassOptions(
            classResult.data.map((c) => ({
              label: c.name,
              value: c.id,
            }))
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
      loadOptions()
    }, [])

    // Notify parent of validity changes
    const title = form.watch("title")
    const classId = form.watch("classId")
    const subjectId = form.watch("subjectId")
    const examType = form.watch("examType")
    React.useEffect(() => {
      const isValid =
        title.trim().length >= 1 &&
        classId.length >= 1 &&
        subjectId.length >= 1 &&
        !!examType
      onValidChange?.(isValid)
    }, [title, classId, subjectId, examType, onValidChange])

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
              const result = await updateExamInformation(examId, data)
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
            placeholder="Enter exam title"
            required
            disabled={isPending}
          />
          <TextareaField
            name="description"
            label="Description"
            placeholder="Enter exam description (optional)"
            disabled={isPending}
          />
          <SelectField
            name="classId"
            label="Class"
            options={[...classOptions]}
            placeholder="Select a class"
            required
            disabled={isPending}
          />
          <SelectField
            name="subjectId"
            label="Subject"
            options={[...subjectOptions]}
            placeholder="Select a subject"
            required
            disabled={isPending}
          />
          <SelectField
            name="examType"
            label="Exam Type"
            options={[...EXAM_TYPE_OPTIONS]}
            required
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
