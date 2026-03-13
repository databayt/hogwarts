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

import { updateTemplateName } from "./actions"
import { nameSchema, type NameFormData } from "./validation"

const EXAM_TYPES = [
  { value: "MIDTERM", label: "Midterm" },
  { value: "FINAL", label: "Final" },
  { value: "QUIZ", label: "Quiz" },
  { value: "POP_QUIZ", label: "Pop Quiz" },
  { value: "MOCK", label: "Mock" },
  { value: "PRACTICE", label: "Practice" },
]

interface NameFormProps {
  templateId: string
  initialData?: Partial<NameFormData>
  onValidChange?: (isValid: boolean) => void
}

export const NameForm = forwardRef<WizardFormRef, NameFormProps>(
  ({ templateId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<NameFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(nameSchema) as any,
      defaultValues: {
        name: initialData?.name || "",
        description: initialData?.description || "",
        examType: initialData?.examType || "MIDTERM",
      },
    })

    // Notify parent of validity changes
    const name = form.watch("name")
    React.useEffect(() => {
      const isValid = name.trim().length >= 1
      onValidChange?.(isValid)
    }, [name, onValidChange])

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
              const result = await updateTemplateName(templateId, data)
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
            name="name"
            label="Template Name"
            placeholder="Enter template name"
            required
            disabled={isPending}
          />
          <TextareaField
            name="description"
            label="Description"
            placeholder="Describe this exam template"
            disabled={isPending}
          />
          <SelectField
            name="examType"
            label="Exam Type"
            options={[...EXAM_TYPES]}
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

NameForm.displayName = "NameForm"
