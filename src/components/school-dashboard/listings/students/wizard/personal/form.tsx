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
import { GENDER_OPTIONS } from "@/components/school-dashboard/listings/students/config"

import { updateStudentPersonal } from "./actions"
import { personalSchema, type PersonalFormData } from "./validation"

interface PersonalFormProps {
  studentId: string
  initialData?: Partial<PersonalFormData>
  onValidChange?: (isValid: boolean) => void
}

export const PersonalForm = forwardRef<WizardFormRef, PersonalFormProps>(
  ({ studentId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<PersonalFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(personalSchema) as any,
      defaultValues: {
        givenName: initialData?.givenName || "",
        middleName: initialData?.middleName || "",
        surname: initialData?.surname || "",
        dateOfBirth: initialData?.dateOfBirth,
        gender: initialData?.gender,
        nationality: initialData?.nationality || "",
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
              const result = await updateStudentPersonal(studentId, data)
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
            name="middleName"
            label="Middle Name"
            placeholder="Enter middle name"
            disabled={isPending}
          />
          <InputField
            name="surname"
            label="Surname"
            placeholder="Enter surname"
            required
            disabled={isPending}
          />
          <DateField
            name="dateOfBirth"
            label="Date of Birth"
            disabled={isPending}
          />
          <SelectField
            name="gender"
            label="Gender"
            options={[...GENDER_OPTIONS]}
            disabled={isPending}
          />
          <InputField
            name="nationality"
            label="Nationality"
            placeholder="Enter nationality"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

PersonalForm.displayName = "PersonalForm"
