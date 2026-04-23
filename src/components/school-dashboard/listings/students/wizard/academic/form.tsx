"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  useTransition,
} from "react"
import { useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { isStreamGrade } from "@/lib/grade-utils"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { createI18nHelpers } from "@/components/internationalization/helpers"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  getGradeOptions,
  getSectionOptions,
  getStreamOptions,
  updateStudentAcademic,
} from "./actions"
import { createAcademicSchema, type AcademicFormData } from "./validation"

interface AcademicFormProps {
  studentId: string
  initialData?: Partial<AcademicFormData>
  onValidChange?: (isValid: boolean) => void
}

export const AcademicForm = forwardRef<WizardFormRef, AcademicFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const students = (dictionary?.school as Record<string, unknown>)
      ?.students as Record<string, unknown> | undefined
    const tEnrollment = students?.enrollment as Record<string, any> | undefined
    const tPrev = students?.previousEducation as
      | Record<string, string>
      | undefined
    const tRoot = students as Record<string, string> | undefined

    const { v } = useMemo(() => {
      const messages = (dictionary as Record<string, unknown>)?.messages as
        | Record<string, unknown>
        | undefined
      if (!messages) return { v: undefined }
      const { validation } = createI18nHelpers(messages as never)
      return { v: validation }
    }, [dictionary])

    const schema = useMemo(() => createAcademicSchema(v), [v])

    const [gradeOptions, setGradeOptions] = useState<
      { value: string; label: string; gradeNumber: number }[]
    >([])
    const [streamOptions, setStreamOptions] = useState<
      { value: string; label: string }[]
    >([])
    const [sectionOptions, setSectionOptions] = useState<
      { value: string; label: string }[]
    >([])

    const form = useForm<AcademicFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        academicGradeId: initialData?.academicGradeId || "",
        academicStreamId: initialData?.academicStreamId || "",
        sectionId: initialData?.sectionId || "",
        previousSchoolName: initialData?.previousSchoolName || "",
      },
    })

    const params = useParams()
    const locale = (params?.lang as string) || "ar"
    const selectedGradeId = form.watch("academicGradeId")

    useEffect(() => {
      getGradeOptions(locale).then((res) => {
        if (res.success && res.data) setGradeOptions(res.data)
      })
    }, [locale])

    useEffect(() => {
      if (!selectedGradeId) {
        setSectionOptions([])
        return
      }
      getSectionOptions(selectedGradeId, locale).then((res) => {
        if (res.success && res.data) setSectionOptions(res.data)
      })
    }, [selectedGradeId, locale])

    const streamEnabled = useMemo(() => {
      const grade = gradeOptions.find((g) => g.value === selectedGradeId)
      return grade ? isStreamGrade(grade.gradeNumber) : false
    }, [selectedGradeId, gradeOptions])

    useEffect(() => {
      if (!selectedGradeId || !streamEnabled) {
        setStreamOptions([])
        return
      }
      getStreamOptions(selectedGradeId, locale).then((res) => {
        if (res.success && res.data) setStreamOptions(res.data)
      })
    }, [selectedGradeId, streamEnabled, locale])

    // Reset sectionId + streamId when grade changes (skip initial mount).
    const gradeRef = React.useRef(initialData?.academicGradeId)
    useEffect(() => {
      if (gradeRef.current !== selectedGradeId) {
        form.setValue("sectionId", "")
        form.setValue("academicStreamId", "")
      }
      gradeRef.current = selectedGradeId
    }, [selectedGradeId, form])

    // Academic step is always valid (all fields optional).
    React.useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const valid = await form.trigger()
              if (!valid) {
                reject(
                  new Error(tRoot?.validationFailed || "Validation failed")
                )
                return
              }
              const data = form.getValues()
              const result = await updateStudentAcademic(studentId, data)
              if (!result.success) {
                ErrorToast(
                  result.error || tRoot?.failedToSave || "Failed to save"
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : tRoot?.failedToSave || "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-8">
          {/* Previous Education */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                name="previousSchoolName"
                label={tPrev?.schoolName || "Previous School"}
                placeholder={
                  tPrev?.schoolNamePlaceholder || "Enter previous school name"
                }
                disabled={isPending}
              />
            </div>
          </div>

          {/* Current Enrollment */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectField
                name="academicGradeId"
                label={tEnrollment?.academicGradeId || "Grade"}
                options={gradeOptions}
                disabled={isPending}
              />
              <SelectField
                name="academicStreamId"
                label={tEnrollment?.academicStreamId || "Stream"}
                options={streamOptions}
                disabled={isPending || !streamEnabled}
              />
              <SelectField
                name="sectionId"
                label={tEnrollment?.sectionId || "Section"}
                options={sectionOptions}
                disabled={isPending || !selectedGradeId}
              />
            </div>
          </div>
        </form>
      </Form>
    )
  }
)

AcademicForm.displayName = "AcademicForm"
