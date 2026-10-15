"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pill segmented control (iOS / apple.com style) on Radix ToggleGroup.
 * Single-select, never empty: clicking the active segment keeps it.
 * Direction follows the document, so segments mirror in RTL.
 */
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

interface Option<T extends string> {
  value: T
  label: React.ReactNode
}

interface SegmentedProps<T extends string> {
  value: T
  onValueChange: (value: T) => void
  options: Option<T>[]
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  disabled,
  className,
  ...rest
}: SegmentedProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      disabled={disabled}
      aria-label={rest["aria-label"]}
      className={cn(
        "bg-muted inline-flex w-full items-center gap-0.5 rounded-full p-0.5 sm:w-auto",
        className
      )}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className={cn(
            "text-muted-foreground flex-1 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-all sm:flex-none",
            "hover:text-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            "data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
