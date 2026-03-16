"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { PhoneInput, type CountryData } from "@/components/atom/phone-input"

import type { BaseFieldProps } from "../types"

interface PhoneFieldProps extends BaseFieldProps {
  defaultCountry?: string
  onCountryChange?: (data: CountryData | undefined) => void
}

export function PhoneField({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  defaultCountry,
  onCountryChange,
}: PhoneFieldProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <PhoneInput
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={placeholder}
              defaultCountry={defaultCountry}
              onCountryChange={onCountryChange}
              disabled={disabled}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
