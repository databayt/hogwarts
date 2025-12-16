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

import type { TextFieldProps } from "./types"

/**
 * Text Field
 *
 * Text input field with react-hook-form integration.
 * Supports text, email, password, tel, and url types.
 *
 * @example
 * ```tsx
 * <TextField
 *   name="email"
 *   label="Email Address"
 *   type="email"
 *   placeholder="you@example.com"
 *   required
 * />
 * ```
 */
export function TextField({
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
