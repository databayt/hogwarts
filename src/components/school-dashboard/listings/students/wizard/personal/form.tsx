"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ar } from "date-fns/locale/ar"
import { enUS } from "date-fns/locale/en-US"
import { useForm } from "react-hook-form"

import type { NameFormat } from "@/lib/name-utils"
import { composeFullName } from "@/lib/name-utils"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import {
  CountryField,
  DateField,
  InputField,
  NameFields,
  PhoneField,
  SelectField,
} from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { createI18nHelpers } from "@/components/internationalization/helpers"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { getGenderOptions } from "@/components/school-dashboard/listings/students/config"

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
    const { locale } = useLocale()
    const dateLocale = useMemo(() => (locale === "ar" ? ar : enUS), [locale])
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
        dateOfBirth: initialData?.dateOfBirth,
        gender: initialData?.gender,
        nationality: initialData?.nationality || "",
        profilePhotoUrl: initialData?.profilePhotoUrl,
        email: initialData?.email || "",
        mobileNumber: initialData?.mobileNumber || "",
        alternatePhone: initialData?.alternatePhone || "",
        emergencyContactName: initialData?.emergencyContactName || "",
        emergencyContactPhone: initialData?.emergencyContactPhone || "",
        emergencyContactRelation: initialData?.emergencyContactRelation || "",
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

    // Notify parent of validity changes — personal step requires a name.
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
          <div className="grid grid-cols-2 gap-7">
            <DateField
              name="dateOfBirth"
              label={t?.dateOfBirth || "Date of Birth"}
              disabled={isPending}
              captionLayout="dropdown"
              startMonth={new Date(1970, 0)}
              endMonth={new Date()}
              maxDate={new Date()}
              locale={dateLocale}
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
          {/* Contact block — absorbed from the retired `contact` step */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-7">
            <InputField
              name="email"
              label={tContact?.email || "Email"}
              placeholder={tContact?.emailPlaceholder || "Enter email address"}
              type="email"
              disabled={isPending}
            />
            <PhoneField
              name="mobileNumber"
              label={tContact?.mobile || "Mobile Number"}
              placeholder={tContact?.mobilePlaceholder || "Enter mobile number"}
              disabled={isPending}
            />
          </div>
          <PhoneField
            name="alternatePhone"
            label={tContact?.alternatePhone || "Alternate Phone"}
            placeholder={
              tContact?.alternatePhonePlaceholder || "Enter alternate phone"
            }
            disabled={isPending}
          />
          {/* Emergency contact — absorbed from retired contact/emergency tab */}
          <div className="space-y-4 rounded-lg border p-4">
            <h4 className="text-sm font-medium">
              {tContact?.emergencyTitle || "Emergency Contact"}
            </h4>
            <InputField
              name="emergencyContactName"
              label={tContact?.emergencyName || "Emergency Contact Name"}
              placeholder={
                tContact?.emergencyNamePlaceholder ||
                "Enter emergency contact name"
              }
              disabled={isPending}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-7">
              <PhoneField
                name="emergencyContactPhone"
                label={tContact?.emergencyPhone || "Emergency Contact Phone"}
                placeholder={
                  tContact?.emergencyPhonePlaceholder ||
                  "Enter emergency contact phone"
                }
                disabled={isPending}
              />
              <InputField
                name="emergencyContactRelation"
                label={tContact?.relationship || "Relationship"}
                placeholder={
                  tContact?.relationshipPlaceholder ||
                  "Enter relationship to student"
                }
                disabled={isPending}
              />
            </div>
          </div>
        </form>
      </Form>
    )
  }
)

PersonalForm.displayName = "PersonalForm"
