"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef } from "react"
import { useFormContext } from "react-hook-form"

import {
  composeFullName,
  parseFullName,
  type NameFormat,
} from "@/lib/name-utils"
import { FieldGroup } from "@/components/ui/field"

import { InputField } from "./input"

interface NameFieldsProps {
  nameFormat: NameFormat
  fields: {
    firstName: string // form field name, e.g. "firstName" or "firstName"
    middleName: string // e.g. "middleName"
    lastName: string // e.g. "lastName" or "lastName"
  }
  labels: {
    firstName: string
    lastName: string
    fullName: string
  }
  placeholders?: {
    firstName?: string
    lastName?: string
    fullName?: string
  }
  required?: boolean
  disabled?: boolean
}

/**
 * NameFields renders either a split (first + last) or a single full-name input,
 * depending on the school's configured nameFormat. In "full" mode, the component
 * parses the entered text into firstName/middleName/lastName on every change
 * and writes them to the underlying form fields.
 */
export function NameFields({
  nameFormat,
  fields,
  labels,
  placeholders,
  required,
  disabled,
}: NameFieldsProps) {
  const form = useFormContext()

  if (nameFormat === "full") {
    return (
      <FullNameField
        form={form}
        fields={fields}
        label={labels.fullName}
        placeholder={placeholders?.fullName}
        required={required}
        disabled={disabled}
      />
    )
  }

  return (
    <>
      <FieldGroup className="grid grid-cols-1 sm:grid-cols-2">
        <InputField
          name={fields.firstName}
          label={required ? `${labels.firstName} *` : labels.firstName}
          placeholder={placeholders?.firstName}
          disabled={disabled}
        />
        <InputField
          name={fields.lastName}
          label={required ? `${labels.lastName} *` : labels.lastName}
          placeholder={placeholders?.lastName}
          disabled={disabled}
        />
      </FieldGroup>
      <InputField
        name={fields.middleName}
        label=""
        className="hidden"
        disabled={disabled}
      />
    </>
  )
}

// Internal component for the "full" name mode
function FullNameField({
  form,
  fields,
  label,
  placeholder,
  required,
  disabled,
}: {
  form: ReturnType<typeof useFormContext>
  fields: NameFieldsProps["fields"]
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}) {
  const isInternalUpdate = useRef(false)

  // Compose initial value from existing form fields
  const firstName = form.watch(fields.firstName)
  const middleName = form.watch(fields.middleName)
  const lastName = form.watch(fields.lastName)

  // Initialize _fullName from existing split fields (e.g. when editing existing record)
  useEffect(() => {
    const currentFull = form.getValues("_fullName")
    if (!currentFull && (firstName || lastName)) {
      const composed = composeFullName(firstName, middleName, lastName)
      if (composed) {
        isInternalUpdate.current = true
        form.setValue("_fullName", composed, { shouldValidate: false })
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Parse full name into split fields on change
  const handleFullNameChange = useCallback(() => {
    const fullName = form.getValues("_fullName") as string
    if (!fullName) {
      form.setValue(fields.firstName, "", { shouldValidate: false })
      form.setValue(fields.middleName, "", { shouldValidate: false })
      form.setValue(fields.lastName, "", { shouldValidate: false })
      return
    }
    const parsed = parseFullName(fullName)
    isInternalUpdate.current = true
    form.setValue(fields.firstName, parsed.firstName, { shouldValidate: false })
    form.setValue(fields.middleName, parsed.middleName ?? "", {
      shouldValidate: false,
    })
    form.setValue(fields.lastName, parsed.lastName, { shouldValidate: false })
  }, [form, fields])

  // Watch _fullName and sync to split fields
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name === "_fullName" && !isInternalUpdate.current) {
        handleFullNameChange()
      }
      isInternalUpdate.current = false
    })
    return () => subscription.unsubscribe()
  }, [form, handleFullNameChange])

  return (
    <>
      <InputField
        name="_fullName"
        label={required ? `${label} *` : label}
        placeholder={placeholder}
        disabled={disabled}
      />
      {/* Hidden fields to hold parsed values */}
      <InputField
        name={fields.firstName}
        label=""
        className="hidden"
        disabled={disabled}
      />
      <InputField
        name={fields.middleName}
        label=""
        className="hidden"
        disabled={disabled}
      />
      <InputField
        name={fields.lastName}
        label=""
        className="hidden"
        disabled={disabled}
      />
    </>
  )
}
