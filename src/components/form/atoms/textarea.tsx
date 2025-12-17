"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

import type { TextareaFieldProps } from "../types"

/**
 * Textarea Field (Atom)
 *
 * Multi-line text input with react-hook-form integration.
 * Supports configurable rows and character limits.
 *
 * **Role**: Single-purpose atom for long-form text entry
 *
 * **Usage Across App**:
 * - Description fields (announcements, events)
 * - Bio fields (user profiles, teacher profiles)
 * - Notes fields (attendance notes, grade comments)
 * - Message fields (contact forms, feedback)
 * - Content fields (lesson content, assignment instructions)
 * - Feedback fields (reviews, evaluations)
 *
 * @example
 * ```tsx
 * <TextareaField
 *   name="description"
 *   label="Description"
 *   rows={4}
 *   maxLength={500}
 * />
 * ```
 */
export function TextareaField({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  rows = 4,
  maxLength,
}: TextareaFieldProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ms-1">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Textarea
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              maxLength={maxLength}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
