"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"

import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import type { CheckboxFieldProps } from "../types"

/**
 * Checkbox Field (Atom)
 *
 * Boolean checkbox input with react-hook-form integration.
 * Supports optional inline label.
 *
 * **Role**: Single-purpose atom for boolean toggle states
 *
 * **Usage Across App**:
 * - Consent checkboxes (terms acceptance)
 * - Preference toggles (notification settings)
 * - Filter checkboxes (search filters)
 * - Bulk selection checkboxes (data tables)
 * - Feature toggles (enable/disable options)
 * - Remember me checkboxes (login forms)
 *
 * @example
 * ```tsx
 * <CheckboxField
 *   name="termsAccepted"
 *   label="Terms & Conditions"
 *   checkboxLabel="I accept the terms and conditions"
 *   required
 * />
 * ```
 */
export function CheckboxField({
  name,
  label,
  description,
  required,
  disabled,
  className,
  checkboxLabel,
}: CheckboxFieldProps) {
  const form = useFormContext()

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
          <div className="flex items-center gap-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
            {checkboxLabel && (
              <label
                htmlFor={name}
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {checkboxLabel}
              </label>
            )}
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
