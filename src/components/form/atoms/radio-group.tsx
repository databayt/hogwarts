"use client"

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import type { BaseFieldProps } from "../types"

interface RadioOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

interface RadioGroupFieldProps extends BaseFieldProps {
  options: RadioOption[]
  orientation?: "horizontal" | "vertical"
}

/**
 * Radio Group Field (Atom)
 *
 * Single selection radio group with react-hook-form integration.
 * Use when options are mutually exclusive and limited.
 *
 * **Role**: Single-purpose atom for exclusive option selection
 *
 * **Usage Across App**:
 * - Plan selection (subscription tiers)
 * - Payment method selection
 * - Priority selection (low, medium, high)
 * - Gender selection
 * - Frequency selection (daily, weekly, monthly)
 * - Delivery method selection
 *
 * @example
 * ```tsx
 * <RadioGroupField
 *   name="priority"
 *   label="Priority Level"
 *   options={[
 *     { value: "low", label: "Low" },
 *     { value: "medium", label: "Medium" },
 *     { value: "high", label: "High" },
 *   ]}
 * />
 * ```
 */
export function RadioGroupField({
  name,
  label,
  description,
  required,
  disabled,
  className,
  options,
  orientation = "vertical",
}: RadioGroupFieldProps) {
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
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={disabled}
              className={
                orientation === "horizontal"
                  ? "flex flex-row space-x-4"
                  : "flex flex-col space-y-2"
              }
            >
              {options.map((option) => (
                <FormItem
                  key={option.value}
                  className="flex items-center space-y-0 space-x-3"
                >
                  <FormControl>
                    <RadioGroupItem
                      value={option.value}
                      disabled={option.disabled}
                    />
                  </FormControl>
                  <div className="space-y-0.5">
                    <FormLabel className="font-normal">
                      {option.label}
                    </FormLabel>
                    {option.description && (
                      <FormDescription className="text-xs">
                        {option.description}
                      </FormDescription>
                    )}
                  </div>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
