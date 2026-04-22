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
import {
  DateField,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/form"
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

    const statusOptions = [
      {
        label: tEnrollment?.statusOptions?.active || "Active",
        value: "ACTIVE",
      },
      {
        label: tEnrollment?.statusOptions?.inactive || "Inactive",
        value: "INACTIVE",
      },
      {
        label: tEnrollment?.statusOptions?.suspended || "Suspended",
        value: "SUSPENDED",
      },
      {
        label: tEnrollment?.statusOptions?.graduated || "Graduated",
        value: "GRADUATED",
      },
      {
        label: tEnrollment?.statusOptions?.transferred || "Transferred",
        value: "TRANSFERRED",
      },
      {
        label: tEnrollment?.statusOptions?.droppedOut || "Dropped Out",
        value: "DROPPED_OUT",
      },
    ]

    const studentTypeOptions = [
      {
        label: tEnrollment?.typeOptions?.regular || "Regular",
        value: "REGULAR",
      },
      {
        label: tEnrollment?.typeOptions?.transfer || "Transfer",
        value: "TRANSFER",
      },
      {
        label: tEnrollment?.typeOptions?.international || "International",
        value: "INTERNATIONAL",
      },
      {
        label: tEnrollment?.typeOptions?.exchange || "Exchange",
        value: "EXCHANGE",
      },
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

    const form = useForm<AcademicFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        enrollmentDate: initialData?.enrollmentDate,
        admissionNumber: initialData?.admissionNumber || "",
        status: initialData?.status,
        studentType: initialData?.studentType,
        category: initialData?.category || "",
        academicGradeId: initialData?.academicGradeId || "",
        academicStreamId: initialData?.academicStreamId || "",
        sectionId: initialData?.sectionId || "",
        previousSchoolName: initialData?.previousSchoolName || "",
        previousSchoolAddress: initialData?.previousSchoolAddress || "",
        previousGrade: initialData?.previousGrade || "",
        transferCertificateNo: initialData?.transferCertificateNo || "",
        transferDate: initialData?.transferDate,
        previousAcademicRecord: initialData?.previousAcademicRecord || "",
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

    // Reset sectionId and streamId when grade changes (skip initial mount)
    const gradeRef = React.useRef(initialData?.academicGradeId)
    useEffect(() => {
      if (gradeRef.current !== selectedGradeId) {
        form.setValue("sectionId", "")
        form.setValue("academicStreamId", "")
      }
      gradeRef.current = selectedGradeId
    }, [selectedGradeId, form])

    // Academic step is always valid (all fields optional)
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
        <form className="space-y-6">
          {/* Enrollment section */}
          <div className="grid grid-cols-2 gap-7">
            <DateField
              name="enrollmentDate"
              label={tEnrollment?.enrollmentDate || "Date"}
              disabled={isPending}
            />
            <InputField
              name="admissionNumber"
              label={tEnrollment?.admissionNumber || "Admission"}
              placeholder={
                tEnrollment?.admissionNumberPlaceholder ||
                "Enter admission number"
              }
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-7">
            <SelectField
              name="status"
              label={tEnrollment?.status || "Status"}
              options={statusOptions}
              disabled={isPending}
            />
            <SelectField
              name="studentType"
              label={tEnrollment?.studentType || "Type"}
              options={studentTypeOptions}
              disabled={isPending}
            />
          </div>
          <InputField
            name="category"
            label={tEnrollment?.category || "Category"}
            placeholder={tEnrollment?.categoryPlaceholder || "Enter category"}
            disabled={isPending}
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-7">
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
          </div>
          <div className="grid grid-cols-2 gap-7">
            <SelectField
              name="sectionId"
              label={tEnrollment?.sectionId || "Section"}
              options={sectionOptions}
              disabled={isPending || !selectedGradeId}
            />
          </div>

          {/* Previous education section */}
          <InputField
            name="previousSchoolName"
            label={tPrev?.schoolName || "Previous School Name"}
            placeholder={
              tPrev?.schoolNamePlaceholder || "Enter previous school name"
            }
            disabled={isPending}
          />
          <TextareaField
            name="previousSchoolAddress"
            label={tPrev?.schoolAddress || "Previous School Address"}
            placeholder={
              tPrev?.schoolAddressPlaceholder || "Enter previous school address"
            }
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-7">
            <InputField
              name="previousGrade"
              label={tPrev?.previousGrade || "Previous Grade"}
              placeholder={
                tPrev?.previousGradePlaceholder || "Enter previous grade level"
              }
              disabled={isPending}
            />
            <InputField
              name="transferCertificateNo"
              label={tPrev?.transferCertificate || "Transfer Certificate No."}
              placeholder={
                tPrev?.transferCertificatePlaceholder ||
                "Enter transfer certificate number"
              }
              disabled={isPending}
            />
          </div>
          <DateField
            name="transferDate"
            label={tPrev?.transferDate || "Transfer Date"}
            disabled={isPending}
          />
          <TextareaField
            name="previousAcademicRecord"
            label={tPrev?.academicRecord || "Previous Academic Record"}
            placeholder={
              tPrev?.academicRecordPlaceholder ||
              "Enter previous academic record details"
            }
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

AcademicForm.displayName = "AcademicForm"
