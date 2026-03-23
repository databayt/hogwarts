"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { type UseFormReturn } from "react-hook-form"

import { EVALUATION_TYPES } from "@/lib/evaluation-types"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface EvaluationTypeSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  disabled?: boolean
}

export function EvaluationTypeSelector({
  form,
  disabled = false,
}: EvaluationTypeSelectorProps) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.classes?.form

  return (
    <FormField
      control={form.control}
      name="evaluationType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{d?.evaluationType || "Evaluation Type"}</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value || "NORMAL"}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    d?.selectEvaluationType || "Select evaluation type"
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.values(EVALUATION_TYPES).map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {type.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            {d?.evaluationDescription ||
              "Choose how student performance will be evaluated in this course"}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
