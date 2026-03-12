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

import { updateStudentContact } from "./actions"
import { contactSchema, type ContactFormData } from "./validation"

interface ContactFormProps {
  studentId: string
  initialData?: Partial<ContactFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ContactForm = forwardRef<WizardFormRef, ContactFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ContactFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(contactSchema) as any,
      defaultValues: {
        email: initialData?.email || "",
        mobileNumber: initialData?.mobileNumber || "",
        alternatePhone: initialData?.alternatePhone || "",
        currentAddress: initialData?.currentAddress || "",
        city: initialData?.city || "",
        state: initialData?.state || "",
        postalCode: initialData?.postalCode || "",
        country: initialData?.country || "",
      },
    })

    // Contact step is always valid (all fields optional)
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
              const result = await updateStudentContact(studentId, data)
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
            name="email"
            label="Email"
            placeholder="Enter email address"
            type="email"
            disabled={isPending}
          />
          <InputField
            name="mobileNumber"
            label="Mobile Number"
            placeholder="Enter mobile number"
            disabled={isPending}
          />
          <InputField
            name="alternatePhone"
            label="Alternate Phone"
            placeholder="Enter alternate phone"
            disabled={isPending}
          />
          <TextareaField
            name="currentAddress"
            label="Current Address"
            placeholder="Enter current address"
            disabled={isPending}
          />
          <InputField
            name="city"
            label="City"
            placeholder="Enter city"
            disabled={isPending}
          />
          <InputField
            name="state"
            label="State"
            placeholder="Enter state"
            disabled={isPending}
          />
          <InputField
            name="postalCode"
            label="Postal Code"
            placeholder="Enter postal code"
            disabled={isPending}
          />
          <InputField
            name="country"
            label="Country"
            placeholder="Enter country"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

ContactForm.displayName = "ContactForm"
