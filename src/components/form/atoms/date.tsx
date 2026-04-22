"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { format } from "date-fns"
import type { Locale } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import type { DateFieldProps } from "../types"

/**
 * Date Field (Atom)
 *
 * Date picker input with react-hook-form integration.
 * Supports min/max dates and custom disabled days.
 *
 * **Role**: Single-purpose atom for date selection
 *
 * **Usage Across App**:
 * - Birth date inputs (student registration)
 * - Deadline inputs (assignments, tasks)
 * - Schedule inputs (events, lessons)
 * - Date filters (reports, attendance)
 * - Start/end date inputs (academic years, terms)
 * - Appointment scheduling (visits)
 *
 * @example
 * ```tsx
 * <DateField
 *   name="birthDate"
 *   label="Date of Birth"
 *   maxDate={new Date()}
 *   required
 * />
 * ```
 */
export function DateField({
  name,
  label,
  description,
  placeholder = "Pick a date",
  required,
  disabled,
  className,
  minDate,
  maxDate,
  disabledDays,
  captionLayout,
  startMonth,
  endMonth,
  locale,
}: DateFieldProps) {
  const form = useFormContext()

  // Combine disabled logic
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    if (disabledDays) return disabledDays(date)
    return false
  }

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
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-start font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {field.value ? (
                    format(
                      new Date(field.value),
                      "PPP",
                      locale ? { locale } : undefined
                    )
                  ) : (
                    <span>{placeholder}</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  field.value
                    ? field.value instanceof Date
                      ? field.value
                      : (() => {
                          const [y, m, d] = String(field.value)
                            .split("-")
                            .map(Number)
                          return Number.isFinite(y) &&
                            Number.isFinite(m) &&
                            Number.isFinite(d)
                            ? new Date(y, m - 1, d)
                            : new Date(field.value)
                        })()
                    : undefined
                }
                onSelect={(date) => {
                  if (!date) return field.onChange("")
                  const y = date.getFullYear()
                  const m = String(date.getMonth() + 1).padStart(2, "0")
                  const d = String(date.getDate()).padStart(2, "0")
                  field.onChange(`${y}-${m}-${d}`)
                }}
                disabled={isDateDisabled}
                captionLayout={captionLayout}
                startMonth={startMonth}
                endMonth={endMonth}
                locale={locale}
                autoFocus
              />
            </PopoverContent>
          </Popover>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
