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

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import {
  InputField,
  NumberField,
  SelectField,
  TextareaField,
} from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { basicsLabels, commonLabels, EXAM_TYPE_LABELS } from "../labels"
import { updateTemplateBasics } from "./actions"
import { basicsSchema, type BasicsFormData } from "./validation"

const EXAM_TYPE_VALUES = [
  "MIDTERM",
  "FINAL",
  "QUIZ",
  "POP_QUIZ",
  "MOCK",
  "PRACTICE",
] as const

interface SubjectOption {
  id: string
  name: string
}

interface BasicsFormProps {
  templateId: string
  initialData?: Partial<BasicsFormData>
  onValidChange?: (isValid: boolean) => void
  subjectOptions: SubjectOption[]
}

export const BasicsForm = forwardRef<WizardFormRef, BasicsFormProps>(
  ({ templateId, initialData, onValidChange, subjectOptions }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { locale } = useLocale()
    const lang = locale === "ar" ? "ar" : "en"

    const form = useForm<BasicsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(basicsSchema) as any,
      defaultValues: {
        name: initialData?.name || "",
        description: initialData?.description || "",
        examType: initialData?.examType || "MIDTERM",
        subjectId: initialData?.subjectId || "",
        duration: initialData?.duration ?? 60,
        totalMarks: initialData?.totalMarks ?? 100,
      },
    })

    const examTypeOptions = useMemo(
      () =>
        EXAM_TYPE_VALUES.map((value) => ({
          value,
          label: EXAM_TYPE_LABELS[value][lang],
        })),
      [lang]
    )

    const subjectSelectOptions = useMemo(
      () => subjectOptions.map((s) => ({ value: s.id, label: s.name })),
      [subjectOptions]
    )

    // Notify parent of validity changes
    const name = form.watch("name")
    const subjectId = form.watch("subjectId")
    const duration = form.watch("duration")
    const totalMarks = form.watch("totalMarks")
    React.useEffect(() => {
      const isValid =
        name.trim().length >= 1 &&
        subjectId.trim().length >= 1 &&
        typeof duration === "number" &&
        duration >= 5 &&
        typeof totalMarks === "number" &&
        totalMarks >= 1
      onValidChange?.(isValid)
    }, [name, subjectId, duration, totalMarks, onValidChange])

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
              const result = await updateTemplateBasics(templateId, data)
              if (!result.success) {
                ErrorToast(result.error || commonLabels.failedToSave[lang])
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : commonLabels.failedToSave[lang]
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
            label={basicsLabels.name[lang]}
            placeholder={basicsLabels.namePlaceholder[lang]}
            required
            disabled={isPending}
          />
          <SelectField
            name="subjectId"
            label={basicsLabels.subject[lang]}
            placeholder={basicsLabels.selectSubject[lang]}
            options={subjectSelectOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="examType"
            label={basicsLabels.examType[lang]}
            options={examTypeOptions}
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              name="duration"
              label={basicsLabels.duration[lang]}
              min={5}
              max={480}
              required
              disabled={isPending}
            />
            <NumberField
              name="totalMarks"
              label={basicsLabels.totalMarks[lang]}
              min={1}
              max={1000}
              required
              disabled={isPending}
            />
          </div>
          <TextareaField
            name="description"
            label={basicsLabels.description[lang]}
            placeholder={basicsLabels.descriptionPlaceholder[lang]}
            rows={2}
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

BasicsForm.displayName = "BasicsForm"
