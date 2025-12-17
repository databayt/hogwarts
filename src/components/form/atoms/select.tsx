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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { SelectFieldProps } from "../types"

/**
 * Select Field (Atom)
 *
 * Dropdown select field with react-hook-form integration.
 * Supports single selection from predefined options.
 *
 * **Role**: Single-purpose select atom for choosing from options
 *
 * **Usage Across App**:
 * - Role selection (teacher, student, guardian)
 * - Status selection (active, inactive, pending)
 * - Category selection (subjects, departments)
 * - Type selection (fee types, announcement types)
 * - Grade level selection
 * - Year selection
 *
 * @example
 * ```tsx
 * <SelectField
 *   name="role"
 *   label="Role"
 *   options={[
 *     { value: "teacher", label: "Teacher" },
 *     { value: "student", label: "Student" },
 *   ]}
 *   required
 * />
 * ```
 */
export function SelectField({
  name,
  label,
  description,
  placeholder = "Select an option",
  required,
  disabled,
  className,
  options,
}: SelectFieldProps) {
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
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-muted-foreground text-sm">
                        {option.description}
                      </div>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
