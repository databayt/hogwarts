"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import {
  CheckboxField,
  DateField,
  InputField,
  TextareaField,
} from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateTeacherExperiences } from "./actions"
import { experiencesSchema, type ExperiencesFormData } from "./validation"

interface ExperienceFormProps {
  teacherId: string
  initialData?: Partial<ExperiencesFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ExperienceForm = forwardRef<WizardFormRef, ExperienceFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ExperiencesFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(experiencesSchema) as any,
      defaultValues: {
        experiences: initialData?.experiences || [],
      },
    })

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "experiences",
    })

    // Experience is optional, always valid
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
              const result = await updateTeacherExperiences(teacherId, data)
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Work Experience</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    institution: "",
                    position: "",
                    startDate: new Date(),
                    endDate: undefined,
                    isCurrent: false,
                    description: "",
                  })
                }
                disabled={isPending}
              >
                <Plus className="me-1 h-4 w-4" />
                Add Experience
              </Button>
            </div>

            {fields.map((field, index) => {
              const isCurrent = form.watch(`experiences.${index}.isCurrent`)

              return (
                <div
                  key={field.id}
                  className="bg-muted/50 space-y-4 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <InputField
                      name={`experiences.${index}.institution`}
                      label="Institution"
                      placeholder="Previous school or organization"
                      required
                      disabled={isPending}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <InputField
                    name={`experiences.${index}.position`}
                    label="Position"
                    placeholder="Job title or role"
                    required
                    disabled={isPending}
                  />
                  <DateField
                    name={`experiences.${index}.startDate`}
                    label="Start Date"
                    disabled={isPending}
                  />
                  <CheckboxField
                    name={`experiences.${index}.isCurrent`}
                    label="Current Position"
                    checkboxLabel="I currently work here"
                    disabled={isPending}
                  />
                  {!isCurrent && (
                    <DateField
                      name={`experiences.${index}.endDate`}
                      label="End Date"
                      disabled={isPending}
                    />
                  )}
                  <TextareaField
                    name={`experiences.${index}.description`}
                    label="Description"
                    placeholder="Responsibilities, achievements..."
                    disabled={isPending}
                  />
                </div>
              )
            })}
          </div>
        </form>
      </Form>
    )
  }
)

ExperienceForm.displayName = "ExperienceForm"
