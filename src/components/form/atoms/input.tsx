"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import type { TextFieldProps } from "../types"

/**
 * Input Field (Atom)
 *
 * Generic text input field with react-hook-form integration.
 * Supports text, email, password, tel, and url types.
 *
 * **Role**: Single-purpose input atom for text-based data entry
 *
 * **Usage Across App**:
 * - Login forms (email, password)
 * - Registration forms (name, email)
 * - Profile forms (name, bio, url)
 * - Search inputs
 * - Contact forms (name, email, phone)
 * - Settings forms
 *
 * @example
 * ```tsx
 * <InputField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   placeholder="you@example.com"
 *   required
 * />
 * ```
 */
export function InputField({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  type = "text",
  maxLength,
  minLength,
}: TextFieldProps) {
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
            <Input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              minLength={minLength}
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

// Backward compatibility alias
export { InputField as TextField }
