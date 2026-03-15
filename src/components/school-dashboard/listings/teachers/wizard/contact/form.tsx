"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateTeacherContact } from "./actions"
import { contactSchema, type ContactFormData } from "./validation"

interface ContactFormProps {
  teacherId: string
  initialData?: Partial<ContactFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ContactForm = forwardRef<WizardFormRef, ContactFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ContactFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(contactSchema) as any,
      defaultValues: {
        emailAddress: initialData?.emailAddress || "",
        phone1: initialData?.phone1 || "",
        phone2: initialData?.phone2 || "",
      },
    })

    const email = form.watch("emailAddress")
    React.useEffect(() => {
      onValidChange?.(email.trim().length > 0 && email.includes("@"))
    }, [email, onValidChange])

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
              const result = await updateTeacherContact(teacherId, data)
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
            name="emailAddress"
            label="Email Address"
            type="email"
            placeholder="teacher@school.edu"
            required
            disabled={isPending}
          />

          <InputField
            name="phone1"
            label="Phone 1"
            placeholder="+1234567890"
            disabled={isPending}
          />
          <InputField
            name="phone2"
            label="Phone 2"
            placeholder="+1234567890"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

ContactForm.displayName = "ContactForm"
