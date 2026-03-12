"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, SelectField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { ASSESSMENT_TYPE_OPTIONS } from "@/components/school-dashboard/listings/assignments/wizard/config"

import { getClassesForAssignment, updateAssignmentInformation } from "./actions"
import { informationSchema, type InformationFormData } from "./validation"

interface InformationFormProps {
  assignmentId: string
  initialData?: Partial<InformationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ assignmentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [classOptions, setClassOptions] = useState<
      { label: string; value: string }[]
    >([])

    const form = useForm<InformationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(informationSchema) as any,
      defaultValues: {
        title: initialData?.title || "",
        classId: initialData?.classId || "",
        type: initialData?.type || "HOMEWORK",
        description: initialData?.description || "",
      },
    })

    // Fetch class options
    useEffect(() => {
      getClassesForAssignment().then((result) => {
        if (result.success && result.data) {
          setClassOptions(result.data)
        }
      })
    }, [])

    // Notify parent of validity changes
    const title = form.watch("title")
    const classId = form.watch("classId")
    React.useEffect(() => {
      const isValid = title.trim().length >= 1 && classId.trim().length >= 1
      onValidChange?.(isValid)
    }, [title, classId, onValidChange])

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
            placeholder="Enter assignment title"
            required
            disabled={isPending}
          />
          <SelectField
            name="classId"
            label="Class"
            options={classOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="type"
            label="Type"
            options={[...ASSESSMENT_TYPE_OPTIONS]}
            required
            disabled={isPending}
          />
          <TextareaField
            name="description"
            label="Description"
            placeholder="Enter assignment description"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
