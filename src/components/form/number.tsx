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
import { Input } from "@/components/ui/input"

import type { NumberFieldProps } from "./types"

/**
 * Number Field
 *
 * Numeric input field with react-hook-form integration.
 *
 * @example
 * ```tsx
 * <NumberField
 *   name="age"
 *   label="Age"
 *   min={0}
 *   max={120}
 *   required
 * />
 * ```
 */
export function NumberField({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  min,
  max,
  step = 1,
}: NumberFieldProps) {
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
            <Input
              type="number"
              placeholder={placeholder}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              {...field}
              onChange={(e) => {
                const value = e.target.value
                field.onChange(value === "" ? undefined : Number(value))
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
