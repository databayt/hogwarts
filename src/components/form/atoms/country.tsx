"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { CountryDropdown } from "@/components/atom/country-dropdown"

import type { BaseFieldProps } from "../types"

interface CountryFieldProps extends BaseFieldProps {
  searchPlaceholder?: string
  emptyMessage?: string
  locale?: string
}

export function CountryField({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  searchPlaceholder,
  emptyMessage,
  locale,
}: CountryFieldProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-col", className)}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
          )}
          <CountryDropdown
            value={field.value}
            onChange={(isoCode) => field.onChange(isoCode)}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            disabled={disabled}
            locale={locale}
          />
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
