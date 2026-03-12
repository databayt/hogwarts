"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateStudentEnrollment } from "./actions"
import { enrollmentSchema, type EnrollmentFormData } from "./validation"

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Graduated", value: "GRADUATED" },
  { label: "Transferred", value: "TRANSFERRED" },
  { label: "Dropped Out", value: "DROPPED_OUT" },
] as const

const STUDENT_TYPE_OPTIONS = [
  { label: "Regular", value: "REGULAR" },
  { label: "Transfer", value: "TRANSFER" },
  { label: "International", value: "INTERNATIONAL" },
  { label: "Exchange", value: "EXCHANGE" },
] as const

interface EnrollmentFormProps {
  studentId: string
  initialData?: Partial<EnrollmentFormData>
  onValidChange?: (isValid: boolean) => void
}

export const EnrollmentForm = forwardRef<WizardFormRef, EnrollmentFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

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
        sectionId: initialData?.sectionId || "",
      },
    })

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
                reject(new Error("Validation failed"))
                return
              }
              const data = form.getValues()
              const result = await updateStudentEnrollment(studentId, data)
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
          <DateField
            name="enrollmentDate"
            label="Enrollment Date"
            disabled={isPending}
          />
          <InputField
            name="admissionNumber"
            label="Admission Number"
            placeholder="Enter admission number"
            disabled={isPending}
          />
          <SelectField
            name="status"
            label="Status"
            options={[...STATUS_OPTIONS]}
            disabled={isPending}
          />
          <SelectField
            name="studentType"
            label="Student Type"
            options={[...STUDENT_TYPE_OPTIONS]}
            disabled={isPending}
          />
          <InputField
            name="category"
            label="Category"
            placeholder="Enter category"
            disabled={isPending}
          />
          <InputField
            name="academicGradeId"
            label="Academic Grade ID"
            placeholder="Enter academic grade ID"
            disabled={isPending}
          />
          <InputField
            name="sectionId"
            label="Section ID"
            placeholder="Enter section ID"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

EnrollmentForm.displayName = "EnrollmentForm"
