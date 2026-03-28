"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { composeFullName } from "@/lib/name-utils"
import { Form } from "@/components/ui/form"
import {
  CountryField,
  DateField,
  NameFields,
  SelectField,
} from "@/components/form"
import { createI18nHelpers } from "@/components/internationalization/helpers"

import { useApplySession } from "../application-context"
import type { PersonalStepData } from "../types"
import { useAutoFillMerge } from "../use-auto-fill-merge"
import { getApplyDict, getApplyOptionsDict } from "../utils"
import { savePersonalStep } from "./actions"
import { getCategoryOptions, getGenderOptions } from "./config"
import type { PersonalFormProps, PersonalFormRef } from "./types"
import { getPersonalSchema, type PersonalSchemaType } from "./validation"

export const PersonalForm = forwardRef<PersonalFormRef, PersonalFormProps>(
  ({ initialData, onSuccess, dictionary }, ref) => {
    const { updateStepData, nameFormat } = useApplySession()

    const { v } = useMemo(() => {
      const messages = (dictionary as Record<string, unknown>)?.messages as
        | Record<string, unknown>
        | undefined
      if (!messages) return { v: undefined }
      const { validation } = createI18nHelpers(messages as never)
      return { v: validation }
    }, [dictionary])

    const schema = getPersonalSchema(nameFormat, v)

    const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        firstName: initialData?.firstName || "",
        middleName: initialData?.middleName || "",
        lastName: initialData?.lastName || "",
        dateOfBirth: initialData?.dateOfBirth || "",
        gender: initialData?.gender || undefined,
        nationality: initialData?.nationality || "",
        religion: initialData?.religion || "",
        category: initialData?.category || "",
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

    // Merge AI-extracted data into empty fields (late-arrival insurance)
    useAutoFillMerge(form, initialData)

    const dict = getApplyDict(dictionary, "personal")
    const optionsDict = getApplyOptionsDict(dictionary)

    const prevDataRef = React.useRef<string>("")
    useEffect(() => {
      const subscription = form.watch((value) => {
        const json = JSON.stringify(value)
        if (json !== prevDataRef.current) {
          prevDataRef.current = json
          // Strip _fullName before updating step data
          const { _fullName, ...stepData } = value as PersonalStepData & {
            _fullName?: string
          }
          updateStepData("personal", stepData as unknown as PersonalStepData)
        }
      })
      return () => subscription.unsubscribe()
    }, [form, updateStepData])

    const saveAndNext = async () => {
      const isValid = await form.trigger()
      if (!isValid) throw new Error("Form validation failed")

      const data = form.getValues()
      // Strip _fullName before saving
      const { _fullName, ...saveData } = data as PersonalSchemaType & {
        _fullName?: string
      }
      const result = await savePersonalStep(saveData as PersonalSchemaType)

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
          <NameFields
            nameFormat={nameFormat}
            fields={{
              firstName: "firstName",
              middleName: "middleName",
              lastName: "lastName",
            }}
            labels={{
              firstName: dict.firstName,
              lastName: dict.lastName,
              fullName: dict.fullName,
            }}
            placeholders={{
              firstName: dict.firstNamePlaceholder,
              lastName: dict.lastNamePlaceholder,
              fullName: dict.fullNamePlaceholder,
            }}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-7">
            <DateField
              name="dateOfBirth"
              label={`${dict.dateOfBirth} *`}
              captionLayout="dropdown"
              startMonth={new Date(1990, 0)}
              endMonth={new Date()}
            />
            <SelectField
              name="gender"
              label={`${dict.gender} *`}
              placeholder={dict.selectGender}
              options={getGenderOptions(optionsDict.gender || {})}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-7">
            <CountryField
              name="nationality"
              label={dict.nationality}
              placeholder={dict.selectNationality}
            />
            <SelectField
              name="category"
              label={dict.category}
              placeholder={dict.selectCategory}
              options={getCategoryOptions(optionsDict.category || {})}
            />
          </div>
        </form>
      </Form>
    )
  }
)

PersonalForm.displayName = "PersonalForm"
