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
import { getGenderOptions } from "@/components/school-dashboard/listings/students/config"

import { updateStudentPersonal } from "./actions"
import { getPersonalSchema, type PersonalFormData } from "./validation"

interface PersonalFormProps {
  studentId: string
  initialData?: Partial<PersonalFormData>
  nameFormat?: NameFormat
  onValidChange?: (isValid: boolean) => void
}

export const PersonalForm = forwardRef<WizardFormRef, PersonalFormProps>(
  ({ studentId, initialData, nameFormat = "full", onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const { dictionary } = useDictionary()
    const students = (dictionary?.school as Record<string, unknown>)
      ?.students as Record<string, unknown> | undefined
    const t = students?.personal as Record<string, string> | undefined
    const tRoot = students as Record<string, string> | undefined

    const schema = getPersonalSchema(nameFormat)

    const form = useForm({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        firstName: initialData?.firstName || "",
        middleName: initialData?.middleName || "",
        lastName: initialData?.lastName || "",
        dateOfBirth: initialData?.dateOfBirth,
        gender: initialData?.gender,
        nationality: initialData?.nationality || "",
        profilePhotoUrl: initialData?.profilePhotoUrl,
        ...(nameFormat === "full"
          ? {
              _fullName: composeFullName(
                initialData?.firstName,
                initialData?.middleName,
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
                  new Error(tRoot?.validationFailed || "Validation failed")
                )
                return
              }
              const data = form.getValues()
              // Strip the virtual _fullName field before saving
              const { _fullName, ...saveData } = data as PersonalFormData & {
                _fullName?: string
              }
              const result = await updateStudentPersonal(
                studentId,
                saveData as PersonalFormData
              )
              if (!result.success) {
                ErrorToast(
                  result.error || tRoot?.failedToSave || "Failed to save"
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : tRoot?.failedToSave || "Failed to save"
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
              middleName: "middleName",
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
              name="dateOfBirth"
              label={t?.dateOfBirth || "Date of Birth"}
              disabled={isPending}
            />
            <SelectField
              name="gender"
              label={t?.gender || "Gender"}
              options={getGenderOptions(
                students as Parameters<typeof getGenderOptions>[0]
              )}
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

PersonalForm.displayName = "PersonalForm"
