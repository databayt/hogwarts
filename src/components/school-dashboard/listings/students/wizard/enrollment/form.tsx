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
import { DateField, InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  getGradeOptions,
  getSectionOptions,
  getStreamOptions,
  updateStudentEnrollment,
} from "./actions"
import { enrollmentSchema, type EnrollmentFormData } from "./validation"

interface EnrollmentFormProps {
  studentId: string
  initialData?: Partial<EnrollmentFormData>
  onValidChange?: (isValid: boolean) => void
}

export const EnrollmentForm = forwardRef<WizardFormRef, EnrollmentFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const students = (dictionary?.school as any)?.students
    const t = students?.enrollment as Record<string, any> | undefined
    const tRoot = students as Record<string, string> | undefined

    const statusOptions = [
      { label: t?.statusOptions?.active || "Active", value: "ACTIVE" },
      { label: t?.statusOptions?.inactive || "Inactive", value: "INACTIVE" },
      { label: t?.statusOptions?.suspended || "Suspended", value: "SUSPENDED" },
      { label: t?.statusOptions?.graduated || "Graduated", value: "GRADUATED" },
      {
        label: t?.statusOptions?.transferred || "Transferred",
        value: "TRANSFERRED",
      },
      {
        label: t?.statusOptions?.droppedOut || "Dropped Out",
        value: "DROPPED_OUT",
      },
    ]

    const studentTypeOptions = [
      { label: t?.typeOptions?.regular || "Regular", value: "REGULAR" },
      { label: t?.typeOptions?.transfer || "Transfer", value: "TRANSFER" },
      {
        label: t?.typeOptions?.international || "International",
        value: "INTERNATIONAL",
      },
      { label: t?.typeOptions?.exchange || "Exchange", value: "EXCHANGE" },
    ]

    const [gradeOptions, setGradeOptions] = useState<
      { value: string; label: string; gradeNumber: number }[]
    >([])
    const [streamOptions, setStreamOptions] = useState<
      { value: string; label: string }[]
    >([])
    const [sectionOptions, setSectionOptions] = useState<
      { value: string; label: string }[]
    >([])

    const form = useForm<EnrollmentFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(enrollmentSchema) as any,
      defaultValues: {
        enrollmentDate: initialData?.enrollmentDate,
        admissionNumber: initialData?.admissionNumber || "",
        status: initialData?.status,
        studentType: initialData?.studentType,
        category: initialData?.category || "",
        academicGradeId: initialData?.academicGradeId || "",
        academicStreamId: initialData?.academicStreamId || "",
        sectionId: initialData?.sectionId || "",
      },
    })

    const params = useParams()
    const locale = (params?.lang as string) || "ar"
    const selectedGradeId = form.watch("academicGradeId")

    // Fetch grades on mount
    useEffect(() => {
      getGradeOptions(locale).then((res) => {
        if (res.success && res.data) setGradeOptions(res.data)
      })
    }, [locale])

    // Fetch sections when grade changes (cascading)
    useEffect(() => {
      if (!selectedGradeId) {
        setSectionOptions([])
        return
      }
      getSectionOptions(selectedGradeId, locale).then((res) => {
        if (res.success && res.data) setSectionOptions(res.data)
      })
    }, [selectedGradeId, locale])

    // Determine if selected grade supports streams (grades 10-12)
    const streamEnabled = useMemo(() => {
      const grade = gradeOptions.find((g) => g.value === selectedGradeId)
      return grade ? isStreamGrade(grade.gradeNumber) : false
    }, [selectedGradeId, gradeOptions])

    // Fetch streams when grade changes and is high school
    useEffect(() => {
      if (!selectedGradeId || !streamEnabled) {
        setStreamOptions([])
        return
      }
      getStreamOptions(selectedGradeId, locale).then((res) => {
        if (res.success && res.data) setStreamOptions(res.data)
      })
    }, [selectedGradeId, streamEnabled, locale])

    // Reset sectionId and streamId when grade changes (skip on initial mount)
    const gradeRef = React.useRef(initialData?.academicGradeId)
    useEffect(() => {
      if (gradeRef.current !== selectedGradeId) {
        form.setValue("sectionId", "")
        form.setValue("academicStreamId", "")
      }
      gradeRef.current = selectedGradeId
    }, [selectedGradeId, form])

    // Enrollment step is always valid (all fields optional)
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
              const result = await updateStudentEnrollment(studentId, data)
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
        <form className="space-y-6">
          <div className="grid grid-cols-2 gap-7">
            <DateField
              name="enrollmentDate"
              label={t?.enrollmentDate || "Date"}
              disabled={isPending}
            />
            <InputField
              name="admissionNumber"
              label={t?.admissionNumber || "Admission"}
              placeholder={
                t?.admissionNumberPlaceholder || "Enter admission number"
              }
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-7">
            <SelectField
              name="status"
              label={t?.status || "Status"}
              options={statusOptions}
              disabled={isPending}
            />
            <SelectField
              name="studentType"
              label={t?.studentType || "Type"}
              options={studentTypeOptions}
              disabled={isPending}
            />
          </div>
          <InputField
            name="category"
            label={t?.category || "Category"}
            placeholder={t?.categoryPlaceholder || "Enter category"}
            disabled={isPending}
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-7">
            <SelectField
              name="academicGradeId"
              label={t?.academicGradeId || "Grade"}
              options={gradeOptions}
              disabled={isPending}
            />
            <SelectField
              name="academicStreamId"
              label={t?.academicStreamId || "Stream"}
              options={streamOptions}
              disabled={isPending || !streamEnabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-7">
            <SelectField
              name="sectionId"
              label={t?.sectionId || "Section"}
              options={sectionOptions}
              disabled={isPending || !selectedGradeId}
            />
          </div>
        </form>
      </Form>
    )
  }
)

EnrollmentForm.displayName = "EnrollmentForm"
