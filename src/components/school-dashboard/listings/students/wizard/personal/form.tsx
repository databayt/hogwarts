"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import type { NameFormat } from "@/lib/name-utils"
import { composeFullName } from "@/lib/name-utils"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { NameFields, PhoneField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { createI18nHelpers } from "@/components/internationalization/helpers"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { updateStudentPersonal } from "./actions"
import {
  getPersonalStudentSchema,
  type PersonalStudentFormData,
} from "./validation"

interface PersonalFormProps {
  studentId: string
  initialData?: Partial<PersonalStudentFormData>
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
    const tContact = students?.contact as Record<string, string> | undefined
    const tRoot = students as Record<string, string> | undefined

    const { v } = useMemo(() => {
      const messages = (dictionary as Record<string, unknown>)?.messages as
        | Record<string, unknown>
        | undefined
      if (!messages) return { v: undefined }
      const { validation } = createI18nHelpers(messages as never)
      return { v: validation }
    }, [dictionary])

    const schema = useMemo(
      () => getPersonalStudentSchema(nameFormat, v),
      [nameFormat, v]
    )

    const form = useForm({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(schema) as any,
      defaultValues: {
        firstName: initialData?.firstName || "",
        middleName: initialData?.middleName || "",
        lastName: initialData?.lastName || "",
        mobileNumber: initialData?.mobileNumber || "",
        alternatePhone: initialData?.alternatePhone || "",
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

    // Auto-fill whatsapp from primary phone (matches application UX).
    const phoneValue = form.watch("mobileNumber")
    useEffect(() => {
      const currentWhatsapp = form.getValues("alternatePhone")
      if (!currentWhatsapp && phoneValue) {
        form.setValue("alternatePhone", phoneValue)
      }
    }, [phoneValue, form])

    // Student sub-tab is valid as soon as a name is present.
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
              // Strip the virtual _fullName field before saving.
              const { _fullName, ...saveData } =
                data as PersonalStudentFormData & {
                  _fullName?: string
                }
              const result = await updateStudentPersonal(
                studentId,
                saveData as PersonalStudentFormData
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-7">
            <PhoneField
              name="mobileNumber"
              label={`${tContact?.phone || t?.phone || "Phone"} *`}
              placeholder={tContact?.phonePlaceholder || "Enter phone number"}
              disabled={isPending}
            />
            <PhoneField
              name="alternatePhone"
              label={tContact?.whatsapp || "WhatsApp"}
              placeholder={tContact?.phonePlaceholder || "Enter phone number"}
              disabled={isPending}
            />
          </div>
        </form>
      </Form>
    )
  }
)

PersonalForm.displayName = "PersonalForm"
