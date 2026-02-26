"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CountryCode {
  code: string
  name: string
  dialCode: string
  flag: string
}

const defaultCountryCodes: CountryCode[] = [
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "AE", name: "UAE", dialCode: "+971", flag: "🇦🇪" },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "JO", name: "Jordan", dialCode: "+962", flag: "🇯🇴" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲" },
  { code: "LB", name: "Lebanon", dialCode: "+961", flag: "🇱🇧" },
  { code: "SY", name: "Syria", dialCode: "+963", flag: "🇸🇾" },
  { code: "IQ", name: "Iraq", dialCode: "+964", flag: "🇮🇶" },
  { code: "YE", name: "Yemen", dialCode: "+967", flag: "🇾🇪" },
  { code: "SD", name: "Sudan", dialCode: "+249", flag: "🇸🇩" },
  { code: "MA", name: "Morocco", dialCode: "+212", flag: "🇲🇦" },
  { code: "DZ", name: "Algeria", dialCode: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisia", dialCode: "+216", flag: "🇹🇳" },
  { code: "LY", name: "Libya", dialCode: "+218", flag: "🇱🇾" },
  { code: "PS", name: "Palestine", dialCode: "+970", flag: "🇵🇸" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
]

interface PhoneFieldProps {
  name: string
  countryCodeName?: string
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  countryCodes?: CountryCode[]
  defaultCountryCode?: string
}

/**
 * Phone Field (Template - Composed Field)
 *
 * Phone input with country code selector.
 * Pre-populated with common Middle Eastern country codes.
 *
 * **Role**: Composed molecule for international phone entry
 *
 * **Usage Across App**:
 * - Contact information forms
 * - Profile forms (primary, secondary phone)
 * - Emergency contact forms
 * - Verification forms (SMS OTP)
 * - Registration forms
 *
 * @example
 * ```tsx
 * <PhoneField
 *   name="phone"
 *   countryCodeName="phoneCountryCode"
 *   label="Phone Number"
 *   defaultCountryCode="SA"
 * />
 * ```
 */
export function PhoneField({
  name,
  countryCodeName = "countryCode",
  label,
  description,
  placeholder = "5XXXXXXXX",
  required,
  disabled,
  className,
  countryCodes = defaultCountryCodes,
  defaultCountryCode = "SA",
}: PhoneFieldProps) {
  const form = useFormContext()

  return (
    <FormItem className={className}>
      {label && (
        <FormLabel>
          {label}
          {required && <span className="text-destructive ms-1">*</span>}
        </FormLabel>
      )}
      <div className="flex gap-2">
        {/* Country code selector */}
        <FormField
          control={form.control}
          name={countryCodeName}
          render={({ field }) => (
            <FormControl>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || defaultCountryCode}
                disabled={disabled}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span>{country.dialCode}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          )}
        />

        {/* Phone number input */}
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormControl>
              <Input
                {...field}
                type="tel"
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1"
                dir="ltr"
              />
            </FormControl>
          )}
        />
      </div>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  )
}
