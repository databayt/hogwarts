"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import dynamic from "next/dynamic"
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
import type { CountryData } from "@/components/atom/phone-input"

import type { BaseFieldProps } from "../types"

// Loaded as its own chunk. The form barrel (@/components/form) re-exports this
// field, so a static import put libphonenumber + country data (~150 KB gzip)
// in the initial JS of every route that imports any field from the barrel —
// 57 routes, most of which render the form only inside a closed dialog.
const PhoneInput = dynamic(() =>
  import("@/components/atom/phone-input").then((m) => m.PhoneInput)
)

interface PhoneFieldProps extends BaseFieldProps {
  defaultCountry?: string
  onCountryChange?: (data: CountryData | undefined) => void
  selectCountryLabel?: string
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
  selectCountryLabel,
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
              selectCountryLabel={selectCountryLabel}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
