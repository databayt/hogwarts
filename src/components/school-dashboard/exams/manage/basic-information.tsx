"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import {
  FormControl,
  FormField,
  FormItem,
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
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { TeachingScopePicker } from "@/components/school-dashboard/teaching-scope/picker"

import { EXAM_TYPES } from "./config"
import { ExamFormStepProps } from "./types"
import { examCreateSchema } from "./validation"

export function BasicInformationStep({ form, isView }: ExamFormStepProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.manage?.form
  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                placeholder={t?.examTitle ?? "Exam title"}
                disabled={isView}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea
                placeholder={
                  t?.examDescription ?? "Exam description (optional)"
                }
                disabled={isView}
                {...field}
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Who sits it: grade → section or whole grade → subject */}
      <TeachingScopePicker
        value={{
          gradeId: form.watch("gradeId") ?? "",
          sectionId: form.watch("sectionId") ?? null,
          subjectId: form.watch("subjectId") ?? "",
        }}
        onChange={(scope) => {
          const opts = { shouldValidate: true, shouldDirty: true }
          form.setValue("gradeId", scope.gradeId, opts)
          form.setValue("sectionId", scope.sectionId, opts)
          form.setValue("subjectId", scope.subjectId, opts)
        }}
        disabled={isView}
      />

      {/* Exam Type */}
      <FormField
        control={form.control}
        name="examType"
        render={({ field }) => (
          <FormItem>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t?.selectExamType ?? "Select exam type"}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EXAM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
