"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { InputField, PhoneField } from "@/components/form"
import { createI18nHelpers } from "@/components/internationalization/helpers"

import { useApplySession } from "../application-context"
import { useAutoFillMerge } from "../use-auto-fill-merge"
import { getApplyDict } from "../utils"
import { saveContactStep } from "./actions"
import type { ContactFormProps, ContactFormRef } from "./types"
import {
  contactSchema,
  createContactSchema,
  type ContactSchemaType,
} from "./validation"

export const ContactForm = forwardRef<ContactFormRef, ContactFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const { updateStepData } = useApplySession()

    const schema = useMemo(() => {
      const messages = (dictionary as Record<string, unknown>)?.messages as
        | Record<string, unknown>
        | undefined
      if (!messages) return contactSchema
      const { validation } = createI18nHelpers(messages as never)
      return createContactSchema(validation)
    }, [dictionary])

    const form = useForm<ContactSchemaType>({
      resolver: zodResolver(schema),
      defaultValues: {
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        alternatePhone: initialData?.alternatePhone || "",
      },
    })

    // Merge AI-extracted data into empty fields (late-arrival insurance)
    useAutoFillMerge(form, initialData)

    const dict = getApplyDict(dictionary, "contact")

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
      if (!isValid) throw new Error("VALIDATION_FAILED")

      const data = form.getValues()
      const result = await saveContactStep(data)

      if (!result.success) throw new Error(result.error || "SAVE_FAILED")

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
            label={`${dict.email} *`}
            placeholder={dict.emailPlaceholder}
            type="email"
          />
          <PhoneField
            name="phone"
            label={`${dict.phone} *`}
            placeholder={dict.phonePlaceholder}
            selectCountryLabel={dict.selectCountry}
          />
          <PhoneField
            name="alternatePhone"
            label={dict.alternatePhone}
            placeholder={dict.alternatePhonePlaceholder}
            selectCountryLabel={dict.selectCountry}
          />
        </form>
      </Form>
    )
  }
)

ContactForm.displayName = "ContactForm"
