"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useFormContext } from "react-hook-form"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOptionalDictionary } from "@/components/internationalization/dictionary-context"
import { useLocale } from "@/components/internationalization/use-locale"

import type { SelectFieldProps } from "../types"

/**
 * Resolves the "nothing selected yet" prompt from, in priority order:
 *   1. the explicit `placeholder` prop
 *   2. `school.common.selectOption` in the dictionary context
 *   3. an ar/en literal (only reachable outside a DictionaryProvider —
 *      tests, Storybook, standalone previews)
 *
 * WHY this is a hook and not a default parameter: the default used to be the
 * literal "Select an option", and 49 of the 66 call sites pass no placeholder
 * at all — so Arabic users read English on most selects in the app. Defaulting
 * from the dictionary makes the localized string the one you get for free.
 */
function useSelectPlaceholder(explicit?: string): string {
  const { locale } = useLocale()
  const dictionary = useOptionalDictionary()
  const common = dictionary?.school?.common as
    | Record<string, string>
    | undefined

  return (
    explicit ||
    common?.selectOption ||
    (locale === "ar" ? "اختر" : "Select an option")
  )
}

/**
 * Select Field (Atom)
 *
 * Dropdown select field with react-hook-form integration.
 * Supports single selection from predefined options.
 *
 * **Role**: Single-purpose select atom for choosing from options
 *
 * **Usage Across App**:
 * - Role selection (teacher, student, guardian)
 * - Status selection (active, inactive, pending)
 * - Category selection (subjects, departments)
 * - Type selection (fee types, announcement types)
 * - Grade level selection
 * - Year selection
 *
 * @example
 * ```tsx
 * <SelectField
 *   name="role"
 *   label="Role"
 *   options={[
 *     { value: "teacher", label: "Teacher" },
 *     { value: "student", label: "Student" },
 *   ]}
 *   required
 * />
 * ```
 */
export function SelectField({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  options,
  onValueChange,
}: SelectFieldProps) {
  const form = useFormContext()
  const resolvedPlaceholder = useSelectPlaceholder(placeholder)

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
          )}
          <Select
            onValueChange={(value) => {
              field.onChange(value)
              onValueChange?.(value)
            }}
            value={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={resolvedPlaceholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-muted-foreground text-sm">
                        {option.description}
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
