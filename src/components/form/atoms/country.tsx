"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import dynamic from "next/dynamic"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useLocale } from "@/components/internationalization/use-locale"

import type { BaseFieldProps } from "../types"

// Loaded as its own chunk — see ./phone.tsx: the form barrel otherwise put
// the country dataset in the initial JS of every route that uses the barrel.
const CountryDropdown = dynamic(() =>
  import("@/components/atom/country-dropdown").then((m) => m.CountryDropdown)
)

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
  // None of the three call sites passed a locale, so /ar listed, searched and
  // showed English names ("سود" found nothing, "No country found." in English).
  // The route's language is the default; an explicit prop still wins.
  const { locale: routeLocale } = useLocale()
  const lang = locale ?? routeLocale
  const ar = lang === "ar"

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
            searchPlaceholder={
              searchPlaceholder ?? (ar ? "ابحث عن دولة..." : "Search country...")
            }
            emptyMessage={
              emptyMessage ?? (ar ? "لم يتم العثور على دولة." : "No country found.")
            }
            disabled={disabled}
            locale={lang}
          />
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
