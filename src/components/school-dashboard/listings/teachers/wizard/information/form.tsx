"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { DateField, InputField, SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { GENDER_OPTIONS } from "@/components/school-dashboard/listings/teachers/config"

import { updateTeacherInformation } from "./actions"
import { informationSchema, type InformationFormData } from "./validation"

interface InformationFormProps {
  teacherId: string
  initialData?: Partial<InformationFormData>
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ teacherId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<InformationFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(informationSchema) as any,
      defaultValues: {
        givenName: initialData?.givenName || "",
        surname: initialData?.surname || "",
        gender: initialData?.gender || "MALE",
        birthDate: initialData?.birthDate,
        profilePhotoUrl: initialData?.profilePhotoUrl,
      },
    })

    // Notify parent of validity changes
    const givenName = form.watch("givenName")
    const surname = form.watch("surname")
    React.useEffect(() => {
      const isValid = givenName.trim().length >= 1 && surname.trim().length >= 1
      onValidChange?.(isValid)
    }, [givenName, surname, onValidChange])

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
              const result = await updateTeacherInformation(teacherId, data)
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
            name="givenName"
            label="Given Name"
            placeholder="Enter given name"
            required
            disabled={isPending}
          />
          <InputField
            name="surname"
            label="Surname"
            placeholder="Enter surname"
            required
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="gender"
              label="Gender"
              options={[...GENDER_OPTIONS]}
              disabled={isPending}
            />
            <DateField
              name="birthDate"
              label="Date of Birth"
              disabled={isPending}
            />
          </div>
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
