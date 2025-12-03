"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export interface LabeledSelectProps {
  label: string
  options: SelectOption[]
  defaultValue?: string
  placeholder?: string
  className?: string
  triggerClassName?: string
  onValueChange?: (value: string) => void
}

export function LabeledSelect({
  label,
  options,
  defaultValue,
  placeholder = "Select",
  className,
  triggerClassName,
  onValueChange,
}: LabeledSelectProps) {
  const id = React.useId()

  return (
    <div className={cn("grid gap-2", className)} data-slot="labeled-select">
      <Label htmlFor={id}>{label}</Label>
      <Select defaultValue={defaultValue} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          className={cn("w-full", triggerClassName)}
          aria-label={label}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
