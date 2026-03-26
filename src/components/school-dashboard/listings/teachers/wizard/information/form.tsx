"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import type { NameFormat } from "@/lib/name-utils"
import { composeFullName } from "@/lib/name-utils"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import {
  CountryField,
  DateField,
  NameFields,
  SelectField,
} from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { GENDER_OPTIONS } from "@/components/school-dashboard/listings/teachers/config"

import { updateTeacherInformation } from "./actions"
import { getInformationSchema, type InformationFormData } from "./validation"

interface InformationFormProps {
  teacherId: string
  initialData?: Partial<InformationFormData>
  nameFormat?: NameFormat
  onValidChange?: (isValid: boolean) => void
}

export const InformationForm = forwardRef<WizardFormRef, InformationFormProps>(
  ({ teacherId, initialData, nameFormat = "full", onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const schema = getInformationSchema(nameFormat)

    const form = useForm({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        firstName: initialData?.firstName || "",
        lastName: initialData?.lastName || "",
        gender: initialData?.gender || "male",
        birthDate: initialData?.birthDate,
        nationality: initialData?.nationality || "",
        ...(nameFormat === "full"
          ? {
              _fullName: composeFullName(
                initialData?.firstName,
                null,
                initialData?.lastName
              ),
            }
          : {}),
      },
    })

    // Notify parent of validity changes
    const firstName = form.watch("firstName")
    const lastName = form.watch("lastName")
    const fullName = nameFormat === "full" ? form.watch("_fullName") : null
    React.useEffect(() => {
      const isValid =
        nameFormat === "full"
          ? (fullName as string)?.trim().length >= 1
          : (firstName as string)?.trim().length >= 1 &&
            (lastName as string)?.trim().length >= 1
      onValidChange?.(isValid)
    }, [firstName, lastName, fullName, nameFormat, onValidChange])

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
              const { _fullName, ...saveData } = data as InformationFormData & {
                _fullName?: string
              }
              const result = await updateTeacherInformation(
                teacherId,
                saveData as InformationFormData
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
          <NameFields
            nameFormat={nameFormat}
            fields={{
              firstName: "firstName",
              middleName: "_unused_middleName",
              lastName: "lastName",
            }}
            labels={{
              firstName: "First Name",
              lastName: "Last Name",
              fullName: "Full Name",
            }}
            placeholders={{
              firstName: "Enter first name",
              lastName: "Enter last name",
              fullName: "Enter full name",
            }}
            required
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-7">
            <DateField
              name="birthDate"
              label="Date of Birth"
              disabled={isPending}
            />
            <SelectField
              name="gender"
              label="Gender"
              options={[...GENDER_OPTIONS]}
              disabled={isPending}
            />
          </div>
          <CountryField
            name="nationality"
            label="Nationality"
            placeholder="Select nationality"
            disabled={isPending}
            className="max-w-xs"
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
