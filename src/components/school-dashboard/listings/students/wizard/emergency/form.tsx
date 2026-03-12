"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateStudentEmergency } from "./actions"
import { emergencySchema, type EmergencyFormData } from "./validation"

interface EmergencyFormProps {
  studentId: string
  initialData?: Partial<EmergencyFormData>
  onValidChange?: (isValid: boolean) => void
}

export const EmergencyForm = forwardRef<WizardFormRef, EmergencyFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<EmergencyFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(emergencySchema) as any,
      defaultValues: {
        emergencyContactName: initialData?.emergencyContactName || "",
        emergencyContactPhone: initialData?.emergencyContactPhone || "",
        emergencyContactRelation: initialData?.emergencyContactRelation || "",
      },
    })

    // Emergency step is always valid (all fields optional)
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
              const result = await updateStudentEmergency(studentId, data)
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
            name="emergencyContactName"
            label="Emergency Contact Name"
            placeholder="Enter contact name"
            disabled={isPending}
          />
          <InputField
            name="emergencyContactPhone"
            label="Emergency Contact Phone"
            placeholder="Enter contact phone"
            disabled={isPending}
          />
          <InputField
            name="emergencyContactRelation"
            label="Relationship"
            placeholder="e.g. Parent, Guardian, Sibling"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

EmergencyForm.displayName = "EmergencyForm"
