"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { SubjectFormStepProps } from "./types"

export function InformationStep({ form, isView }: SubjectFormStepProps) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.subjects
  return (
    <div className="w-full space-y-4">
      <FormField
        control={form.control}
        name="customName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {d?.form?.customName || "Custom Name (optional)"}
            </FormLabel>
            <FormControl>
              <Input
                placeholder={
                  d?.form?.customNamePlaceholder ||
                  "School-specific name override"
                }
                disabled={isView}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isRequired"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>
                {d?.form?.requiredSubject || "Required Subject"}
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                {d?.form?.requiredSubjectHint ||
                  "Mark as core (required) or elective"}
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isView}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="weeklyPeriods"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {d?.form?.weeklyPeriods || "Weekly Periods (optional)"}
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                placeholder={
                  d?.form?.weeklyPeriodsPlaceholder ||
                  "Number of periods per week"
                }
                disabled={isView}
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  field.onChange(val ? parseInt(val, 10) : undefined)
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
