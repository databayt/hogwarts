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

import { updateStudentPreviousEducation } from "./actions"
import {
  previousEducationSchema,
  type PreviousEducationFormData,
} from "./validation"

interface PreviousEducationFormProps {
  studentId: string
  initialData?: Partial<PreviousEducationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const PreviousEducationForm = forwardRef<
  WizardFormRef,
  PreviousEducationFormProps
>(({ studentId, initialData, onValidChange }, ref) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<PreviousEducationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(previousEducationSchema) as any,
    defaultValues: {
      previousSchoolName: initialData?.previousSchoolName || "",
      previousSchoolAddress: initialData?.previousSchoolAddress || "",
      previousGrade: initialData?.previousGrade || "",
      transferCertificateNo: initialData?.transferCertificateNo || "",
      transferDate: initialData?.transferDate,
      previousAcademicRecord: initialData?.previousAcademicRecord || "",
    },
  })

  // Previous education step is always valid (all fields optional)
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
            const result = await updateStudentPreviousEducation(studentId, data)
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
          name="previousSchoolName"
          label="Previous School Name"
          placeholder="Enter previous school name"
          disabled={isPending}
        />
        <TextareaField
          name="previousSchoolAddress"
          label="Previous School Address"
          placeholder="Enter previous school address"
          disabled={isPending}
        />
        <InputField
          name="previousGrade"
          label="Previous Grade"
          placeholder="Enter previous grade level"
          disabled={isPending}
        />
        <InputField
          name="transferCertificateNo"
          label="Transfer Certificate No."
          placeholder="Enter transfer certificate number"
          disabled={isPending}
        />
        <DateField
          name="transferDate"
          label="Transfer Date"
          disabled={isPending}
        />
        <TextareaField
          name="previousAcademicRecord"
          label="Previous Academic Record"
          placeholder="Enter previous academic record details"
          disabled={isPending}
        />
      </form>
    </Form>
  )
})

PreviousEducationForm.displayName = "PreviousEducationForm"
