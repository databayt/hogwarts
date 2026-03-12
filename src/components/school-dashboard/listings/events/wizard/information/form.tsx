"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, SelectField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { EVENT_TYPE_OPTIONS } from "@/components/school-dashboard/listings/events/wizard/config"

import { updateEventInformation } from "./actions"
import { informationSchema, type InformationFormData } from "./validation"

interface InformationFormProps {
  eventId: string
  initialData?: Partial<InformationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ eventId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<InformationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(informationSchema) as any,
      defaultValues: {
        title: initialData?.title || "",
        description: initialData?.description || "",
        eventType: initialData?.eventType,
        organizer: initialData?.organizer || "",
        targetAudience: initialData?.targetAudience || "",
      },
    })

    // Notify parent of validity changes
    const title = form.watch("title")
    React.useEffect(() => {
      const isValid = title.trim().length >= 1
      onValidChange?.(isValid)
    }, [title, onValidChange])

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
              const result = await updateEventInformation(eventId, data)
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
            name="title"
            label="Title"
            placeholder="Enter event title"
            required
            disabled={isPending}
          />
          <TextareaField
            name="description"
            label="Description"
            placeholder="Enter event description"
            disabled={isPending}
          />
          <SelectField
            name="eventType"
            label="Event Type"
            options={[...EVENT_TYPE_OPTIONS]}
            disabled={isPending}
          />
          <InputField
            name="organizer"
            label="Organizer"
            placeholder="Enter organizer name"
            disabled={isPending}
          />
          <InputField
            name="targetAudience"
            label="Target Audience"
            placeholder="e.g. Students, Parents, Staff"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
