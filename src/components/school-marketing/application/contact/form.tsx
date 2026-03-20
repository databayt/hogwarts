"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useEffect, useImperativeHandle } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { InputField, PhoneField } from "@/components/form"

import { useApplySession } from "../application-context"
import { saveContactStep } from "./actions"
import type { ContactFormProps, ContactFormRef } from "./types"
import { contactSchema, type ContactSchemaType } from "./validation"

export const ContactForm = forwardRef<ContactFormRef, ContactFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const { updateStepData } = useApplySession()

    const form = useForm<ContactSchemaType>({
      resolver: zodResolver(contactSchema),
      defaultValues: {
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        alternatePhone: initialData?.alternatePhone || "",
      },
    })

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.contact ?? {}) as Record<string, string>

    const prevDataRef = React.useRef<string>("")
    useEffect(() => {
      const subscription = form.watch((value) => {
        const json = JSON.stringify(value)
        if (json !== prevDataRef.current) {
          prevDataRef.current = json
          updateStepData("contact", value as ContactSchemaType)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, updateStepData])

    const saveAndNext = async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Form validation failed")

      const data = form.getValues()
      const result = await saveContactStep(data)

      if (!result.success) throw new Error(result.error || "Failed to save")

      if (result.data) {
        updateStepData("contact", result.data)
      }

      onSuccess?.()
    }

    useImperativeHandle(ref, () => ({ saveAndNext }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <InputField
            name="email"
            label={`${dict.email || "Email"} *`}
            placeholder={dict.emailPlaceholder || "email@example.com"}
            type="email"
          />
          <PhoneField
            name="phone"
            label={`${dict.phone || "Phone"} *`}
            placeholder={dict.phonePlaceholder || "+249 XXX XXX XXXX"}
          />
          <PhoneField
            name="alternatePhone"
            label={dict.alternatePhone || "Alternate Phone"}
            placeholder={dict.alternatePhonePlaceholder || "+249 XXX XXX XXXX"}
          />
        </form>
      </Form>
    )
  }
)

ContactForm.displayName = "ContactForm"
