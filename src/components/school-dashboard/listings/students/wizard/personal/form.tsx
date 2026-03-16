"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { ErrorToast } from "@/components/atom/toast"
import {
  CountryField,
  DateField,
  InputField,
  SelectField,
} from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { getGenderOptions } from "@/components/school-dashboard/listings/students/config"

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
    const { dictionary } = useDictionary()
    const students = (dictionary?.school as any)?.students
    const t = students?.personal as Record<string, string> | undefined
    const tRoot = students as Record<string, string> | undefined

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
                reject(
                  new Error(tRoot?.validationFailed || "Validation failed")
                )
                return
              }
              const data = form.getValues()
              const result = await updateStudentPersonal(studentId, data)
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
          <FieldGroup className="grid grid-cols-2">
            <FormField
              control={form.control}
              name="givenName"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="givenName">
                    {t?.givenName || "Given Name"}
                    <span className="text-destructive ms-1">*</span>
                  </FieldLabel>
                  <FormItem>
                    <FormControl>
                      <Input
                        id="givenName"
                        placeholder={
                          t?.givenNamePlaceholder || "Enter given name"
                        }
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </Field>
              )}
            />
            <FormField
              control={form.control}
              name="surname"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="surname">
                    {t?.surname || "Surname"}
                    <span className="text-destructive ms-1">*</span>
                  </FieldLabel>
                  <FormItem>
                    <FormControl>
                      <Input
                        id="surname"
                        placeholder={t?.surnamePlaceholder || "Enter surname"}
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </Field>
              )}
            />
          </FieldGroup>
          <InputField
            name="middleName"
            label={t?.middleName || "Middle Name"}
            placeholder={t?.middleNamePlaceholder || "Enter middle name"}
            disabled={isPending}
            className="hidden"
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
              options={getGenderOptions(students)}
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
