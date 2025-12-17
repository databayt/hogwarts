"use client"

import * as React from "react"
import { format } from "date-fns"
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
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {field.value ? (
                    format(new Date(field.value), "PPP")
                  ) : (
                    <span>{placeholder}</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) =>
                  field.onChange(date?.toISOString().split("T")[0])
                }
                disabled={isDateDisabled}
                initialFocus
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
