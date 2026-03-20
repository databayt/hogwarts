"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useEffect, useImperativeHandle } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { FieldGroup } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import {
  CountryField,
  DateField,
  InputField,
  SelectField,
} from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { PersonalStepData } from "../types"
import { savePersonalStep } from "./actions"
import { CATEGORY_OPTIONS, GENDER_OPTIONS } from "./config"
import type { PersonalFormProps, PersonalFormRef } from "./types"
import { personalSchema, type PersonalSchemaType } from "./validation"

export const PersonalForm = forwardRef<PersonalFormRef, PersonalFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const { locale } = useLocale()
    const isRTL = locale === "ar"
    const { updateStepData } = useApplySession()

    const form = useForm<PersonalSchemaType>({
      resolver: zodResolver(personalSchema),
      defaultValues: {
        firstName: initialData?.firstName || "",
        middleName: initialData?.middleName || "",
        lastName: initialData?.lastName || "",
        dateOfBirth: initialData?.dateOfBirth || "",
        gender: initialData?.gender || undefined,
        nationality: initialData?.nationality || "",
        religion: initialData?.religion || "",
        category: initialData?.category || "",
      },
    })

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.personal ?? {}) as Record<string, string>

    const prevDataRef = React.useRef<string>("")
    useEffect(() => {
      const subscription = form.watch((value) => {
        const json = JSON.stringify(value)
        if (json !== prevDataRef.current) {
          prevDataRef.current = json
          updateStepData("personal", value as unknown as PersonalStepData)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, updateStepData])

    const saveAndNext = async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Form validation failed")

      const data = form.getValues()
      const result = await savePersonalStep(data)

      if (!result.success) throw new Error(result.error || "Failed to save")

      if (result.data) {
        updateStepData("personal", result.data as PersonalStepData)
      }

      onSuccess?.()
    }

    useImperativeHandle(ref, () => ({ saveAndNext }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <FieldGroup className="grid grid-cols-2">
            <InputField
              name="firstName"
              label={`${dict.firstName || "First Name"} *`}
              placeholder={dict.firstNamePlaceholder || "Enter first name"}
            />
            <InputField
              name="lastName"
              label={`${dict.lastName || "Last Name"} *`}
              placeholder={dict.lastNamePlaceholder || "Enter last name"}
            />
          </FieldGroup>
          <InputField
            name="middleName"
            label={dict.middleName || "Middle Name"}
            placeholder={dict.middleNamePlaceholder || "Enter middle name"}
            className="hidden"
          />
          <div className="grid grid-cols-2 gap-7">
            <DateField
              name="dateOfBirth"
              label={`${dict.dateOfBirth || "Date of Birth"} *`}
            />
            <SelectField
              name="gender"
              label={`${dict.gender || "Gender"} *`}
              placeholder={dict.selectGender || "Select gender"}
              options={GENDER_OPTIONS(isRTL).map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-7">
            <CountryField
              name="nationality"
              label={dict.nationality || "Nationality"}
              placeholder={dict.selectNationality || "Select nationality"}
            />
            <SelectField
              name="category"
              label={dict.category || "Category"}
              placeholder={dict.selectCategory || "Select category"}
              options={CATEGORY_OPTIONS(isRTL).map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </div>
        </form>
      </Form>
    )
  }
)

PersonalForm.displayName = "PersonalForm"
