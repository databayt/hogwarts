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

import { updateAnnouncementContent } from "./actions"
import { contentSchema, type ContentFormData } from "./validation"

const LANG_OPTIONS = [
  { label: "العربية", value: "ar" },
  { label: "English", value: "en" },
]

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
]

interface ContentFormProps {
  announcementId: string
  initialData?: Partial<ContentFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ContentForm = forwardRef<WizardFormRef, ContentFormProps>(
  ({ announcementId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ContentFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(contentSchema) as any,
      defaultValues: {
        title: initialData?.title || "",
        body: initialData?.body || "",
        lang: initialData?.lang || "ar",
        priority: initialData?.priority || "normal",
      },
    })

    // Notify parent of validity changes
    const title = form.watch("title")
    const body = form.watch("body")
    React.useEffect(() => {
      const isValid = title.trim().length >= 1 && body.trim().length >= 1
      onValidChange?.(isValid)
    }, [title, body, onValidChange])

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
              const result = await updateAnnouncementContent(
                announcementId,
                data
              )
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
            placeholder="Enter announcement title"
            required
            disabled={isPending}
          />
          <TextareaField
            name="body"
            label="Body"
            placeholder="Enter announcement body"
            required
            disabled={isPending}
          />
          <SelectField
            name="lang"
            label="Language"
            options={[...LANG_OPTIONS]}
            disabled={isPending}
          />
          <SelectField
            name="priority"
            label="Priority"
            options={[...PRIORITY_OPTIONS]}
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

ContentForm.displayName = "ContentForm"
