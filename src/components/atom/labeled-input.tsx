// @ts-nocheck
"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input, type InputProps } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface LabeledInputProps extends Omit<InputProps, "id"> {
  label: string
  containerClassName?: string
}

export function LabeledInput({
  label,
  containerClassName,
  className,
  ...props
}: LabeledInputProps) {
  const id = React.useId()

  return (
    <div className={cn("grid gap-2", containerClassName)} data-slot="labeled-input">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className={className} {...props} />
    </div>
  )
}
