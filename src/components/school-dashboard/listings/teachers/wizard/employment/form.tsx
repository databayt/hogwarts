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
import {
  EMPLOYMENT_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
} from "@/components/school-dashboard/listings/teachers/config"

import { updateTeacherEmployment } from "./actions"
import { employmentSchema, type EmploymentFormData } from "./validation"

interface EmploymentFormProps {
  teacherId: string
  initialData?: Partial<EmploymentFormData>
  onValidChange?: (isValid: boolean) => void
}

export const EmploymentForm = forwardRef<WizardFormRef, EmploymentFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<EmploymentFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(employmentSchema) as any,
      defaultValues: {
        employeeId: initialData?.employeeId || "",
        joiningDate: initialData?.joiningDate,
        employmentStatus: initialData?.employmentStatus || "ACTIVE",
        employmentType: initialData?.employmentType || "FULL_TIME",
        contractStartDate: initialData?.contractStartDate,
        contractEndDate: initialData?.contractEndDate,
      },
    })

    // Employment is optional, always valid
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
              const result = await updateTeacherEmployment(teacherId, data)
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

    const employmentType = form.watch("employmentType")

    return (
      <Form {...form}>
        <form className="space-y-6">
          <InputField
            name="employeeId"
            label="Employee ID"
            placeholder="EMP-001"
            disabled={isPending}
          />
          <DateField
            name="joiningDate"
            label="Joining Date"
            disabled={isPending}
          />
          <SelectField
            name="employmentStatus"
            label="Employment Status"
            options={[...EMPLOYMENT_STATUS_OPTIONS]}
            disabled={isPending}
          />
          <SelectField
            name="employmentType"
            label="Employment Type"
            options={[...EMPLOYMENT_TYPE_OPTIONS]}
            disabled={isPending}
          />
          {employmentType === "CONTRACT" && (
            <>
              <DateField
                name="contractStartDate"
                label="Contract Start Date"
                disabled={isPending}
              />
              <DateField
                name="contractEndDate"
                label="Contract End Date"
                disabled={isPending}
              />
            </>
          )}
        </form>
      </Form>
    )
  }
)

EmploymentForm.displayName = "EmploymentForm"
