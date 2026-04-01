"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"
import { ar } from "date-fns/locale/ar"
import { enUS } from "date-fns/locale/en-US"
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
import { DateField } from "@/components/form"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ApplicationFormData } from "../types"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

const NATIONALITIES = [
  { value: "Sudanese", label: "سوداني" },
  { value: "Egyptian", label: "مصري" },
  { value: "Saudi", label: "سعودي" },
  { value: "Emirati", label: "إماراتي" },
  { value: "Other", label: "أخرى" },
]

const GENDERS = [
  { value: "MALE", label: "ذكر" },
  { value: "FEMALE", label: "أنثى" },
]

export default function StepPersonal({ dictionary, lang }: Props) {
  const { control } = useFormContext<ApplicationFormData>()
  const isRTL = lang === "ar"
  const dateLocale = useMemo(() => (lang === "ar" ? ar : enUS), [lang])

  const dict =
    (
      dictionary as unknown as {
        school?: { admission?: { formSteps?: Record<string, string> } }
      }
    )?.school?.admission?.formSteps ?? {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* First Name */}
        <FormField
          control={control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.firstName || "First Name"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={dict.enterFirstName || "Enter first name"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Middle Name */}
        <FormField
          control={control}
          name="middleName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dict.middleName || "Middle Name"}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={dict.enterMiddleName || "Enter middle name"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Last Name */}
        <FormField
          control={control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.lastName || "Last Name"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={dict.enterLastName || "Enter last name"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Date of Birth */}
        <DateField
          name="dateOfBirth"
          label={`${dict.dateOfBirth || "Date of Birth"} *`}
          placeholder={dict.pickDate || "Pick a date"}
          captionLayout="dropdown"
          startMonth={new Date(1990, 0)}
          endMonth={new Date()}
          maxDate={new Date()}
          locale={dateLocale}
          required
        />

        {/* Gender */}
        <FormField
          control={control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.gender || "Gender"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={dict.selectGender || "Select gender"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Nationality */}
        <FormField
          control={control}
          name="nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {dict.nationality || "Nationality"}{" "}
                <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        dict.selectNationality || "Select nationality"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {NATIONALITIES.map((nat) => (
                    <SelectItem key={nat.value} value={nat.value}>
                      {nat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Religion */}
        <FormField
          control={control}
          name="religion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{dict.religion || "Religion"}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={dict.enterReligion || "Enter religion"}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Category (optional) */}
      <FormField
        control={control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{dict.category || "Category"}</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder={
                  dict.categoryPlaceholder || "e.g., General, Special"
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
