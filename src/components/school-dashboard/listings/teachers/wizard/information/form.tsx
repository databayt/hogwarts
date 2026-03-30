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
import { useDictionary } from "@/components/internationalization/use-dictionary"

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
    const { dictionary } = useDictionary()
    const teachers = (dictionary?.school as Record<string, unknown>)
      ?.teachers as Record<string, unknown> | undefined
    const wizard = teachers?.wizard as Record<string, unknown> | undefined
    const t = wizard?.information as Record<string, string> | undefined
    const tWizard = wizard as Record<string, string> | undefined

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
                reject(
                  new Error(tWizard?.validationFailed || "Validation failed")
                )
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
                ErrorToast(
                  result.error || tWizard?.failedToSave || "Failed to save"
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : tWizard?.failedToSave || "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    const genderOptions = [
      { value: "male", label: t?.male || "Male" },
      { value: "female", label: t?.female || "Female" },
    ]

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
              firstName: t?.firstName || "First Name",
              lastName: t?.lastName || "Last Name",
              fullName: t?.fullName || "Full Name",
            }}
            placeholders={{
              firstName: t?.firstNamePlaceholder || "Enter first name",
              lastName: t?.lastNamePlaceholder || "Enter last name",
              fullName: t?.fullNamePlaceholder || "Enter full name",
            }}
            required
            disabled={isPending}
          />
          <div className="grid grid-cols-2 gap-7">
            <DateField
              name="birthDate"
              label={t?.dateOfBirth || "Date of Birth"}
              disabled={isPending}
            />
            <SelectField
              name="gender"
              label={t?.gender || "Gender"}
              options={genderOptions}
              disabled={isPending}
            />
          </div>
          <CountryField
            name="nationality"
            label={t?.nationality || "Nationality"}
            placeholder={t?.nationalityPlaceholder || "Select nationality"}
            disabled={isPending}
            className="max-w-xs"
          />
        </form>
      </Form>
    )
  }
)

InformationForm.displayName = "InformationForm"
