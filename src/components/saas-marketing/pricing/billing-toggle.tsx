"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface BillingToggleProps {
  isYearly: boolean
  onChange: (isYearly: boolean) => void
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
  className?: string
}

export function BillingToggle({
  isYearly,
  onChange,
  dictionary,
  className,
}: BillingToggleProps) {
  const pricing = dictionary?.marketing?.pricing

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={isYearly ? "yearly" : "monthly"}
      onValueChange={(val) => {
        if (!val) return // ignore clearing
        onChange(val === "yearly")
      }}
      aria-label="toggle-year"
      className={cn(
        "bg-background relative grid h-9 grid-cols-2 overflow-hidden rounded-md border p-0",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "bg-muted pointer-events-none absolute inset-y-0 start-0 w-1/2 rounded-md transition-transform duration-200 ease-out",
          isYearly ? "translate-x-full rtl:-translate-x-full" : "translate-x-0"
        )}
      />
      <ToggleGroupItem
        value="monthly"
        className={cn(
          "z-10 h-9 w-full min-w-24 justify-center rounded-md px-6",
          isYearly
            ? "text-muted-foreground hover:text-foreground hover:bg-background"
            : "text-foreground"
        )}
        aria-label="Toggle monthly billing"
      >
        {pricing?.constants?.monthly || "Monthly"}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="yearly"
        className={cn(
          "z-10 h-9 w-full min-w-24 justify-center rounded-md px-6",
          isYearly
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-background"
        )}
        aria-label="Toggle yearly billing"
      >
        {pricing?.constants?.yearly || "Yearly"}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
