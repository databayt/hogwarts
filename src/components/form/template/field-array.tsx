"use client"

import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface FieldArrayProps {
  name: string
  label?: string
  description?: string
  placeholder?: string
  addButtonLabel?: string
  maxItems?: number
  minItems?: number
  className?: string
}

/**
 * Field Array (Template - Composed Field)
 *
 * Dynamic list of fields that can be added/removed.
 * Uses react-hook-form's useFieldArray for state management.
 *
 * **Role**: Composed molecule for dynamic field lists
 *
 * **Usage Across App**:
 * - Multiple email addresses
 * - Multiple phone numbers
 * - Address lists
 * - Skills/tags lists
 * - Emergency contacts
 * - Education history entries
 *
 * @example
 * ```tsx
 * <FieldArray
 *   name="emails"
 *   label="Email Addresses"
 *   placeholder="email@example.com"
 *   addButtonLabel="Add another email"
 *   maxItems={5}
 * />
 * ```
 */
export function FieldArray({
  name,
  label,
  description,
  placeholder,
  addButtonLabel = "Add item",
  maxItems = 10,
  minItems = 1,
  className,
}: FieldArrayProps) {
  const form = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name,
  })

  const canAdd = fields.length < maxItems
  const canRemove = fields.length > minItems

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <div className="space-y-1">
          <FormLabel>{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <FormField
            key={field.id}
            control={form.control}
            name={`${name}.${index}.value`}
            render={({ field: inputField }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      {...inputField}
                      placeholder={placeholder}
                      className="flex-1"
                    />
                  </FormControl>
                  {canRemove && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => remove(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ value: "" })}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {addButtonLabel}
        </Button>
      )}
    </div>
  )
}
