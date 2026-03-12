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
import { DateField, InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { QUALIFICATION_TYPE_OPTIONS } from "@/components/school-dashboard/listings/teachers/config"

import { updateTeacherQualifications } from "./actions"
import { qualificationsSchema, type QualificationsFormData } from "./validation"

interface QualificationsFormProps {
  teacherId: string
  initialData?: Partial<QualificationsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const QualificationsForm = forwardRef<
  WizardFormRef,
  QualificationsFormProps
>(({ teacherId, initialData, onValidChange }, ref) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<QualificationsFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(qualificationsSchema) as any,
    defaultValues: {
      qualifications: initialData?.qualifications || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "qualifications",
  })

  // Qualifications step is optional, always valid
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
            const result = await updateTeacherQualifications(teacherId, data)
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
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="relative space-y-4 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Qualification {index + 1}</p>
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
              name={`qualifications.${index}.qualificationType`}
              label="Type"
              options={[...QUALIFICATION_TYPE_OPTIONS]}
              disabled={isPending}
            />
            <InputField
              name={`qualifications.${index}.name`}
              label="Qualification Name"
              placeholder="e.g., Bachelor of Science"
              disabled={isPending}
            />
            <InputField
              name={`qualifications.${index}.institution`}
              label="Institution"
              placeholder="e.g., University of Khartoum"
              disabled={isPending}
            />
            <InputField
              name={`qualifications.${index}.major`}
              label="Major / Field of Study"
              placeholder="e.g., Mathematics"
              disabled={isPending}
            />
            <DateField
              name={`qualifications.${index}.dateObtained`}
              label="Date Obtained"
              disabled={isPending}
            />
            <DateField
              name={`qualifications.${index}.expiryDate`}
              label="Expiry Date"
              disabled={isPending}
            />
            <InputField
              name={`qualifications.${index}.licenseNumber`}
              label="License Number"
              placeholder="e.g., LIC-12345"
              disabled={isPending}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              qualificationType: "DEGREE",
              name: "",
              institution: "",
              major: "",
              dateObtained: undefined,
              expiryDate: undefined,
              licenseNumber: "",
              documentUrl: "",
            })
          }
          disabled={isPending}
          className="w-full"
        >
          <Plus className="me-2 h-4 w-4" />
          Add Qualification
        </Button>
      </form>
    </Form>
  )
})

QualificationsForm.displayName = "QualificationsForm"
