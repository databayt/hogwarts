"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useTransition,
} from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { resolveActionError } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { CheckboxField, InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { completeEventWizard } from "../actions"
import { updateEventSettings } from "./actions"
import { createSettingsSchema, type SettingsFormData } from "./validation"

interface SettingsFormProps {
  eventId: string
  initialData?: Partial<SettingsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const SettingsForm = forwardRef<WizardFormRef, SettingsFormProps>(
  ({ eventId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const { dictionary } = useDictionary()
    const { locale: lang } = useLocale()
    const wst = dictionary?.school?.events?.wizard?.settings as
      | Record<string, string>
      | undefined

    const schema = useMemo(
      () => createSettingsSchema(dictionary?.school?.events?.validation),
      [dictionary]
    )

    const form = useForm<SettingsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        maxAttendees: initialData?.maxAttendees,
        isPublic: initialData?.isPublic ?? false,
        registrationRequired: initialData?.registrationRequired ?? false,
        notes: initialData?.notes || "",
      },
    })

    // Settings step is always valid (no required fields)
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

              // Save settings — actions return error codes, so translate.
              const saveResult = await updateEventSettings(eventId, data)
              if (!saveResult.success) {
                ErrorToast(
                  resolveActionError(saveResult.error ?? "", dictionary)
                )
                reject(new Error(saveResult.error))
                return
              }

              // Complete the wizard
              const completeResult = await completeEventWizard(eventId)
              if (!completeResult.success) {
                ErrorToast(
                  resolveActionError(completeResult.error ?? "", dictionary)
                )
                reject(new Error(completeResult.error))
                return
              }

              // Redirect to events list (locale-prefixed — a bare /events drops
              // the user out of their language).
              router.push(`/${lang}/events`)
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
            name="maxAttendees"
            label={wst?.maxAttendeesLabel || "Max Attendees"}
            type="number"
            placeholder={
              wst?.maxAttendeesPlaceholder || "Leave empty for unlimited"
            }
            disabled={isPending}
          />
          <CheckboxField
            name="isPublic"
            checkboxLabel={wst?.isPublicLabel || "Make this event public"}
            disabled={isPending}
          />
          <CheckboxField
            name="registrationRequired"
            checkboxLabel={
              wst?.registrationRequiredLabel || "Require registration"
            }
            disabled={isPending}
          />
          <TextareaField
            name="notes"
            label={wst?.notesLabel || "Notes"}
            placeholder={
              wst?.notesPlaceholder || "Additional notes about this event"
            }
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

SettingsForm.displayName = "SettingsForm"
