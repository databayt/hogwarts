"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, SelectField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { getDictAssignmentTypes } from "@/components/school-dashboard/listings/assignments/config"
import { TeachingScopePicker } from "@/components/school-dashboard/teaching-scope/picker"
import type { TeachingScopeValue } from "@/components/school-dashboard/teaching-scope/validation"

import { updateAssignmentInformation } from "./actions"
import { assignmentValidationOf } from "../../validation-messages"
import {
  createInformationSchema,
  type InformationFormData,
} from "./validation"

interface InformationFormProps {
  assignmentId: string
  initialData?: Partial<InformationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ assignmentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const formMessages = ((dictionary as any)?.assignments?.form ?? {}) as Record<string, string>
    const fd = (dictionary?.school as Record<string, any>)?.assignments
      ?.form as Record<string, any> | undefined
    // Type labels come from the dictionary (`school.assignments.detail.types`)
    const typeOptions = getDictAssignmentTypes(
      (dictionary?.school as Record<string, any>)?.assignments
    )

    const form = useForm<InformationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(
        createInformationSchema(assignmentValidationOf(dictionary))
      ) as any,
      defaultValues: {
        title: initialData?.title || "",
        gradeId: initialData?.gradeId || "",
        sectionId: initialData?.sectionId ?? null,
        subjectId: initialData?.subjectId || "",
        type: initialData?.type || "HOMEWORK",
        description: initialData?.description || "",
      },
    })

    // Notify parent of validity changes
    const title = form.watch("title")
    const gradeId = form.watch("gradeId")
    const sectionId = form.watch("sectionId")
    const subjectId = form.watch("subjectId")
    React.useEffect(() => {
      const isValid =
        title.trim().length >= 1 && gradeId.length >= 1 && subjectId.length >= 1
      onValidChange?.(isValid)
    }, [title, gradeId, subjectId, onValidChange])

    const setScope = useCallback(
      (scope: TeachingScopeValue) => {
        const opts = { shouldValidate: true, shouldDirty: true }
        form.setValue("gradeId", scope.gradeId, opts)
        form.setValue("sectionId", scope.sectionId, opts)
        form.setValue("subjectId", scope.subjectId, opts)
      },
      [form]
    )

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
              const result = await updateAssignmentInformation(
                assignmentId,
                data
              )
              if (!result.success) {
                ErrorToast(
                  actionErrorMessage(result.error, dictionary, formMessages.saveFailed ?? "")
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              ErrorToast(actionErrorMessage("UNKNOWN", dictionary, formMessages.saveFailed ?? ""))
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
            label={fd?.assignmentTitle ?? ""}
            placeholder={fd?.enterTitle ?? ""}
            required
            disabled={isPending}
          />
          <TeachingScopePicker
            value={{ gradeId, sectionId, subjectId }}
            onChange={setScope}
            disabled={isPending}
          />
          <SelectField
            name="type"
            label={fd?.assignmentType ?? ""}
            options={[...typeOptions]}
            required
            disabled={isPending}
          />
          <TextareaField
            name="description"
            label={fd?.description ?? ""}
            placeholder={fd?.enterDescription ?? ""}
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
