"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { resolveActionError } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, SelectField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  EVENT_TYPE_OPTIONS,
  getEventTypeOptions,
} from "@/components/school-dashboard/listings/events/wizard/config"

import { updateEventInformation } from "./actions"
import { createInformationSchema, type InformationFormData } from "./validation"

interface InformationFormProps {
  eventId: string
  initialData?: Partial<InformationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ eventId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const wi = dictionary?.school?.events?.wizard?.information as
      | Record<string, string>
      | undefined
    const typeOptions = getEventTypeOptions(dictionary?.school?.events)

    const schema = useMemo(
      () => createInformationSchema(dictionary?.school?.events?.validation),
      [dictionary]
    )

    const form = useForm<InformationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
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
                // Actions return error codes — translate before display.
                ErrorToast(resolveActionError(result.error ?? "", dictionary))
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
            label={wi?.titleLabel || "Title"}
            placeholder={wi?.titlePlaceholder || "Enter event title"}
            required
            disabled={isPending}
          />
          <TextareaField
            name="description"
            label={wi?.descriptionLabel || "Description"}
            placeholder={
              wi?.descriptionPlaceholder || "Enter event description"
            }
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="eventType"
              label={wi?.eventTypeLabel || "Event Type"}
              options={[...typeOptions]}
              disabled={isPending}
            />
            <InputField
              name="targetAudience"
              label={wi?.targetAudienceLabel || "Target Audience"}
              placeholder={
                wi?.targetAudiencePlaceholder || "e.g. Students, Parents, Staff"
              }
              disabled={isPending}
            />
          </div>
          <InputField
            name="organizer"
            label={wi?.organizerLabel || "Organizer"}
            placeholder={wi?.organizerPlaceholder || "Enter organizer name"}
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
