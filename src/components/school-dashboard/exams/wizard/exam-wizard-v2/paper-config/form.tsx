"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { CheckboxField, InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updatePaperConfig } from "./actions"
import { paperConfigSchema, type PaperConfigFormData } from "./validation"

const TEMPLATE_OPTIONS = [
  { label: "Classic", value: "CLASSIC" },
  { label: "Modern", value: "MODERN" },
  { label: "Formal", value: "FORMAL" },
  { label: "Custom", value: "CUSTOM" },
]

const PAGE_SIZE_OPTIONS = [
  { label: "A4", value: "A4" },
  { label: "Letter", value: "Letter" },
]

interface PaperConfigFormProps {
  generatedExamId: string
  initialData?: Partial<PaperConfigFormData>
  onValidChange?: (isValid: boolean) => void
}

export const PaperConfigForm = forwardRef<WizardFormRef, PaperConfigFormProps>(
  ({ generatedExamId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<PaperConfigFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(paperConfigSchema) as any,
      defaultValues: {
        template: initialData?.template || "CLASSIC",
        pageSize: initialData?.pageSize || "A4",
        shuffleQuestions: initialData?.shuffleQuestions ?? true,
        shuffleOptions: initialData?.shuffleOptions ?? true,
        versionCount: initialData?.versionCount ?? 1,
        showSchoolLogo: initialData?.showSchoolLogo ?? true,
        showInstructions: initialData?.showInstructions ?? true,
        showPointsPerQuestion: initialData?.showPointsPerQuestion ?? true,
      },
    })

    // Optional step, always valid
    useEffect(() => {
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
              const result = await updatePaperConfig(generatedExamId, data)
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
          <div className="grid gap-6 sm:grid-cols-2">
            <SelectField
              name="template"
              label="Paper Template"
              options={TEMPLATE_OPTIONS}
              disabled={isPending}
            />
            <SelectField
              name="pageSize"
              label="Page Size"
              options={PAGE_SIZE_OPTIONS}
              disabled={isPending}
            />
          </div>
          <InputField
            name="versionCount"
            label="Number of Versions"
            type="number"
            placeholder="1"
            disabled={isPending}
          />
          <div className="space-y-4">
            <CheckboxField
              name="shuffleQuestions"
              label="Shuffle Questions"
              description="Randomize question order across versions"
              disabled={isPending}
            />
            <CheckboxField
              name="shuffleOptions"
              label="Shuffle Options"
              description="Randomize answer option order for MCQ questions"
              disabled={isPending}
            />
            <CheckboxField
              name="showSchoolLogo"
              label="Show School Logo"
              description="Display the school logo on the exam paper header"
              disabled={isPending}
            />
            <CheckboxField
              name="showInstructions"
              label="Show Instructions"
              description="Include exam instructions section on the paper"
              disabled={isPending}
            />
            <CheckboxField
              name="showPointsPerQuestion"
              label="Show Points Per Question"
              description="Display point value next to each question"
              disabled={isPending}
            />
          </div>
        </form>
      </Form>
    )
  }
)

PaperConfigForm.displayName = "PaperConfigForm"
