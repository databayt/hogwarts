"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useFormContext } from "react-hook-form"

import {
  FormControl,
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
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ApplicationFormData } from "../types"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

const COUNTRIES = [
  { value: "Sudan", label: "السودان" },
  { value: "Egypt", label: "مصر" },
  {
    value: "Saudi Arabia",
    label: "المملكة العربية السعودية",
  },
  { value: "UAE", label: "الإمارات العربية المتحدة" },
  { value: "Other", label: "أخرى" },
]

export default function StepContact({ dictionary, lang }: Props) {
  const { control } = useFormContext<ApplicationFormData>()
  const isRTL = lang === "ar"

  const dict =
    (
      dictionary as unknown as {
        school?: { admission?: { formSteps?: Record<string, string> } }
      }
    )?.school?.admission?.formSteps ?? {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Email */}
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.emailAddress || "Email"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="example@email.com"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.phoneNumber || "Phone Number"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} type="tel" placeholder="+249 123 456 789" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Alternate Phone */}
      <FormField
        control={control}
        name="alternatePhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dict.alternatePhone || "Alternate Phone"}</FormLabel>
            <FormControl>
              <Input {...field} type="tel" placeholder="+249 987 654 321" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Address */}
      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {dict.address || "Address"}{" "}
              <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder={dict.enterFullAddress || "Enter full address"}
                rows={2}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* City */}
        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.city || "City"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={dict.enterCity || "Enter city"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* State */}
        <FormField
          control={control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.stateProvince || "State/Province"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={dict.enterState || "Enter state"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Postal Code */}
        <FormField
          control={control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.postalCode || "Postal Code"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="12345" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Country */}
        <FormField
          control={control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.country || "Country"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "Sudan"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={dict.selectCountry || "Select country"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
