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
import { CountryField, DateField, SelectField } from "@/components/form"
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
        gender: initialData?.gender || "male",
        birthDate: initialData?.birthDate,
        nationality: initialData?.nationality || "",
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
          <FieldGroup className="grid grid-cols-2">
            <FormField
              control={form.control}
              name="givenName"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="givenName">
                    Given Name
                    <span className="text-destructive ms-1">*</span>
                  </FieldLabel>
                  <FormItem>
                    <FormControl>
                      <Input
                        id="givenName"
                        placeholder="Enter given name"
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
                    Surname
                    <span className="text-destructive ms-1">*</span>
                  </FieldLabel>
                  <FormItem>
                    <FormControl>
                      <Input
                        id="surname"
                        placeholder="Enter surname"
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
