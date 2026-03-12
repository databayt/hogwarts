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
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { EXPERTISE_LEVEL_OPTIONS } from "@/components/school-dashboard/listings/teachers/config"

import { getSubjectsForExpertise, updateTeacherExpertise } from "./actions"
import { expertiseSchema, type ExpertiseFormData } from "./validation"

interface SubjectOption {
  id: string
  subjectName: string
  department: { id: string; departmentName: string } | null
}

interface ExpertiseFormProps {
  teacherId: string
  initialData?: Partial<ExpertiseFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ExpertiseForm = forwardRef<WizardFormRef, ExpertiseFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [subjects, setSubjects] = useState<SubjectOption[]>([])

    const form = useForm<ExpertiseFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(expertiseSchema) as any,
      defaultValues: {
        subjectExpertise: initialData?.subjectExpertise || [],
      },
    })

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "subjectExpertise",
    })

    // Fetch subjects on mount
    useEffect(() => {
      async function loadSubjects() {
        const result = await getSubjectsForExpertise()
        if (result.success && result.data) {
          setSubjects(result.data)
        }
      }
      loadSubjects()
    }, [])

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
              const result = await updateTeacherExpertise(teacherId, data)
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

    const subjectOptions = subjects.map((s) => ({
      label: s.subjectName,
      value: s.id,
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Subject Expertise</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    subjectId: "",
                    expertiseLevel: "PRIMARY",
                  })
                }
                disabled={isPending}
              >
                <Plus className="me-1 h-4 w-4" />
                Add Subject
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-muted/50 space-y-4 rounded-lg border p-4"
              >
                <div className="flex items-start justify-between">
                  <SelectField
                    name={`subjectExpertise.${index}.subjectId`}
                    label="Subject"
                    options={subjectOptions}
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
                <SelectField
                  name={`subjectExpertise.${index}.expertiseLevel`}
                  label="Expertise Level"
                  options={[...EXPERTISE_LEVEL_OPTIONS]}
                  disabled={isPending}
                />
              </div>
            ))}
          </div>
        </form>
      </Form>
    )
  }
)

ExpertiseForm.displayName = "ExpertiseForm"
