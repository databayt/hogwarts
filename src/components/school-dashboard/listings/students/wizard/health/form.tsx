"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateStudentHealth } from "./actions"
import { healthSchema, type HealthFormData } from "./validation"

const BLOOD_GROUP_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
] as const

interface HealthFormProps {
  studentId: string
  initialData?: Partial<HealthFormData>
  onValidChange?: (isValid: boolean) => void
}

export const HealthForm = forwardRef<WizardFormRef, HealthFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<HealthFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(healthSchema) as any,
      defaultValues: {
        medicalConditions: initialData?.medicalConditions || "",
        allergies: initialData?.allergies || "",
        medicationRequired: initialData?.medicationRequired || "",
        doctorName: initialData?.doctorName || "",
        doctorContact: initialData?.doctorContact || "",
        insuranceProvider: initialData?.insuranceProvider || "",
        insuranceNumber: initialData?.insuranceNumber || "",
        bloodGroup: initialData?.bloodGroup || "",
      },
    })

    // Health step is always valid (all fields optional)
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
              const result = await updateStudentHealth(studentId, data)
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
          <TextareaField
            name="medicalConditions"
            label="Medical Conditions"
            placeholder="Enter any medical conditions"
            disabled={isPending}
          />
          <TextareaField
            name="allergies"
            label="Allergies"
            placeholder="Enter any allergies"
            disabled={isPending}
          />
          <TextareaField
            name="medicationRequired"
            label="Medication Required"
            placeholder="Enter any required medication"
            disabled={isPending}
          />
          <InputField
            name="doctorName"
            label="Doctor Name"
            placeholder="Enter doctor's name"
            disabled={isPending}
          />
          <InputField
            name="doctorContact"
            label="Doctor Contact"
            placeholder="Enter doctor's contact number"
            disabled={isPending}
          />
          <InputField
            name="insuranceProvider"
            label="Insurance Provider"
            placeholder="Enter insurance provider"
            disabled={isPending}
          />
          <InputField
            name="insuranceNumber"
            label="Insurance Number"
            placeholder="Enter insurance number"
            disabled={isPending}
          />
          <InputField
            name="bloodGroup"
            label="Blood Group"
            placeholder="e.g. A+, B-, O+"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

HealthForm.displayName = "HealthForm"
