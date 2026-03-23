"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { EvaluationTypeSelector } from "./evaluation-type-selector"
import { PrerequisiteSelector } from "./prerequisite-selector"
import { ClassFormStepProps } from "./types"

export function CourseManagementStep({ form, isView }: ClassFormStepProps) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.classes?.form
  // Note: 'id' field only exists in update schema, not in create schema
  // PrerequisiteSelector handles undefined currentClassId gracefully
  const currentClassId = undefined

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="courseCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{d?.courseCode || "Course Code"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    d?.courseCodePlaceholder || "e.g., CS101, MATH201"
                  }
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                {d?.courseCodeDescription ||
                  "Unique identifier for this course"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="credits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{d?.creditHours || "Credit Hours"}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999.99"
                  placeholder={d?.creditHoursPlaceholder || "e.g., 3.0"}
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                {d?.creditHoursDescription ||
                  "Academic credits for this course"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <EvaluationTypeSelector form={form} disabled={isView} />

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="minCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{d?.minStudents || "Min Students"}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={d?.minStudentsPlaceholder || "e.g., 10"}
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                {d?.minEnrollment || "Minimum enrollment"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxCapacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{d?.maxStudents || "Max Students"}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={d?.maxStudentsPlaceholder || "e.g., 50"}
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                {d?.maxEnrollment || "Maximum enrollment"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{d?.durationWeeks || "Duration (weeks)"}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder={d?.durationPlaceholder || "e.g., 16"}
                  disabled={isView}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                {d?.courseLength || "Course length"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <PrerequisiteSelector
        form={form}
        disabled={isView}
        currentClassId={currentClassId}
      />
    </div>
  )
}
