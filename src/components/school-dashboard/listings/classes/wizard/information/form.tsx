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
import { InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  getGradesForClass,
  getSubjectsForClass,
  getTeachersForClass,
} from "../actions"
import { updateClassInformation } from "./actions"
import { informationSchema, type InformationFormData } from "./validation"

interface InformationFormProps {
  classId: string
  initialData?: Partial<InformationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ classId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const d = dictionary?.school?.classes?.wizard?.information
    const [subjectOptions, setSubjectOptions] = useState<
      { label: string; value: string }[]
    >([])
    const [teacherOptions, setTeacherOptions] = useState<
      { label: string; value: string }[]
    >([])
    const [gradeOptions, setGradeOptions] = useState<
      { label: string; value: string }[]
    >([])

    const form = useForm<InformationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(informationSchema) as any,
      defaultValues: {
        name: initialData?.name || "",
        subjectId: initialData?.subjectId || "",
        teacherId: initialData?.teacherId || "",
        gradeId: initialData?.gradeId,
        courseCode: initialData?.courseCode || "",
        evaluationType: initialData?.evaluationType || "NORMAL",
      },
    })

    // Load select options
    useEffect(() => {
      const loadOptions = async () => {
        const [subjects, teachers, grades] = await Promise.all([
          getSubjectsForClass(),
          getTeachersForClass(),
          getGradesForClass(),
        ])
        if (subjects.success && subjects.data) setSubjectOptions(subjects.data)
        if (teachers.success && teachers.data) setTeacherOptions(teachers.data)
        if (grades.success && grades.data) setGradeOptions(grades.data)
      }
      loadOptions()
    }, [])

    // Notify parent of validity changes
    const name = form.watch("name")
    const subjectId = form.watch("subjectId")
    const teacherId = form.watch("teacherId")
    useEffect(() => {
      const isValid =
        name.trim().length >= 1 &&
        subjectId.length >= 1 &&
        teacherId.length >= 1
      onValidChange?.(isValid)
    }, [name, subjectId, teacherId, onValidChange])

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
              const result = await updateClassInformation(classId, data)
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

    const evaluationTypeOptions = [
      {
        label: d?.evaluationOptions?.normal || "Normal (Percentage)",
        value: "NORMAL",
      },
      {
        label: d?.evaluationOptions?.gpa || "GPA (Grade Point Average)",
        value: "GPA",
      },
      {
        label: d?.evaluationOptions?.cwa || "CWA (Cumulative Weighted Average)",
        value: "CWA",
      },
      {
        label:
          d?.evaluationOptions?.cce ||
          "CCE (Continuous Comprehensive Evaluation)",
        value: "CCE",
      },
    ]

    return (
      <Form {...form}>
        <form className="space-y-6">
          <InputField
            name="name"
            label={d?.className || "Class Name"}
            placeholder={
              d?.classNamePlaceholder || "e.g. Mathematics Grade 10 - Section A"
            }
            required
            disabled={isPending}
          />
          <SelectField
            name="subjectId"
            label={d?.subject || "Subject"}
            options={subjectOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="teacherId"
            label={d?.teacher || "Teacher"}
            options={teacherOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="gradeId"
            label={d?.grade || "Grade"}
            options={gradeOptions}
            disabled={isPending}
          />
          <InputField
            name="courseCode"
            label={d?.courseCode || "Course Code"}
            placeholder={d?.courseCodePlaceholder || "e.g. MATH-101"}
            disabled={isPending}
          />
          <SelectField
            name="evaluationType"
            label={d?.evaluationType || "Evaluation Type"}
            options={evaluationTypeOptions}
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
