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
import { useDictionary } from "@/components/internationalization/use-dictionary"

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
    const { dictionary } = useDictionary()
    const teachers = (dictionary?.school as Record<string, unknown>)
      ?.teachers as Record<string, unknown> | undefined
    const wizard = teachers?.wizard as Record<string, unknown> | undefined
    const t = wizard?.employment as Record<string, string> | undefined
    const tWizard = wizard as Record<string, string> | undefined

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
                reject(
                  new Error(tWizard?.validationFailed || "Validation failed")
                )
                return
              }
              const data = form.getValues()
              const result = await updateTeacherEmployment(teacherId, data)
              if (!result.success) {
                ErrorToast(
                  result.error || tWizard?.failedToSave || "Failed to save"
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : tWizard?.failedToSave || "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    const employmentType = form.watch("employmentType")

    const statusOptions = [
      { value: "ACTIVE", label: t?.active || "Active" },
      { value: "ON_LEAVE", label: t?.onLeave || "On Leave" },
      { value: "TERMINATED", label: t?.terminated || "Terminated" },
      { value: "RETIRED", label: t?.retired || "Retired" },
    ]

    const typeOptions = [
      { value: "FULL_TIME", label: t?.fullTime || "Full-Time" },
      { value: "PART_TIME", label: t?.partTime || "Part-Time" },
      { value: "CONTRACT", label: t?.contract || "Contract" },
      { value: "SUBSTITUTE", label: t?.substitute || "Substitute" },
    ]

    return (
      <Form {...form}>
        <form className="space-y-6">
          <InputField
            name="employeeId"
            label={t?.employeeId || "Employee ID"}
            placeholder={t?.employeeIdPlaceholder || "EMP-001"}
            disabled={isPending}
          />
          <DateField
            name="joiningDate"
            label={t?.joiningDate || "Joining Date"}
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="employmentStatus"
              label={t?.employmentStatus || "Employment Status"}
              options={statusOptions}
              disabled={isPending}
              className="w-full"
            />
            <SelectField
              name="employmentType"
              label={t?.employmentType || "Employment Type"}
              options={typeOptions}
              disabled={isPending}
              className="w-full"
            />
          </div>
          {employmentType === "CONTRACT" && (
            <>
              <DateField
                name="contractStartDate"
                label={t?.contractStartDate || "Contract Start Date"}
                disabled={isPending}
              />
              <DateField
                name="contractEndDate"
                label={t?.contractEndDate || "Contract End Date"}
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
