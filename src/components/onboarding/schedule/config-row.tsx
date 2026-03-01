"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cn } from "@/lib/utils"

interface ConfigRowProps<T extends string | number> {
  label: string
  options: { value: T; label: string }[]
  selected: T
  onChange: (value: T) => void
  visible: boolean
}

export function ConfigRow<T extends string | number>({
  label,
  options,
  selected,
  onChange,
  visible,
}: ConfigRowProps<T>) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        visible
          ? "max-h-24 translate-y-0 opacity-100"
          : "max-h-0 translate-y-2 opacity-0"
      )}
    >
      <p className="text-muted-foreground mb-1 text-xs font-medium">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors",
              selected === opt.value
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-primary/50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
