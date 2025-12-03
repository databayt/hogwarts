// @ts-nocheck
"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Textarea, type TextareaProps } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface LabeledTextareaProps extends Omit<TextareaProps, "id"> {
  label: string
  containerClassName?: string
}

export function LabeledTextarea({
  label,
  containerClassName,
  className,
  ...props
}: LabeledTextareaProps) {
  const id = React.useId()

  return (
    <div className={cn("grid gap-2", containerClassName)} data-slot="labeled-textarea">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} className={className} {...props} />
    </div>
  )
}
