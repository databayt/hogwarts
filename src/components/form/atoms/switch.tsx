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
import { Switch } from "@/components/ui/switch"

import type { BaseFieldProps } from "../types"

/**
 * Switch Field (Atom)
 *
 * Toggle switch input with react-hook-form integration.
 * Visual alternative to checkbox for on/off states.
 *
 * **Role**: Single-purpose atom for toggle settings
 *
 * **Usage Across App**:
 * - Settings toggles (dark mode, notifications)
 * - Feature flags (enable/disable features)
 * - Active/inactive states (user status)
 * - Notification preferences (email, SMS, push)
 * - Privacy settings (profile visibility)
 * - Auto-save toggles
 *
 * @example
 * ```tsx
 * <SwitchField
 *   name="notifications"
 *   label="Enable Notifications"
 *   description="Receive email notifications for important updates"
 * />
 * ```
 */
export function SwitchField({
  name,
  label,
  description,
  required,
  disabled,
  className,
}: BaseFieldProps) {
  const form = useFormContext()

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={`flex flex-row items-center justify-between rounded-lg border p-4 ${className || ""}`}
        >
          <div className="space-y-0.5">
            {label && (
              <FormLabel className="text-base">
                {label}
                {required && <span className="text-destructive ms-1">*</span>}
              </FormLabel>
            )}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
