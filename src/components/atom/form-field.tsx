"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface FormFieldProps extends React.ComponentProps<"div"> {
  label: string
  id?: string
  children: React.ReactNode
}

export function FormField({
  label,
  id,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div data-slot="form-field" className={cn("grid gap-2", className)} {...props}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export interface FormFieldTextProps
  extends Omit<React.ComponentProps<typeof Input>, "id"> {
  label: string
  id?: string
}

export function FormFieldText({
  label,
  id,
  className,
  ...props
}: FormFieldTextProps) {
  const inputId = id ?? React.useId()

  return (
    <FormField label={label} id={inputId} className={className}>
      <Input data-slot="form-field-input" id={inputId} {...props} />
    </FormField>
  )
}
