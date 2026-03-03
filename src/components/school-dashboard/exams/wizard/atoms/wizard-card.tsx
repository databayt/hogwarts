// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export const wizardCardVariants = cva(
  "rounded-lg border transition-all cursor-pointer",
  {
    variants: {
      state: {
        idle: "border-border hover:border-primary/50 hover:shadow-sm",
        selected: "border-primary ring-2 ring-primary/20 shadow-sm",
        disabled: "opacity-50 cursor-not-allowed pointer-events-none",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
    },
    defaultVariants: { state: "idle", size: "md" },
  }
)

interface WizardCardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof wizardCardVariants> {}

export const WizardCard = forwardRef<HTMLDivElement, WizardCardProps>(
  ({ className, state, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(wizardCardVariants({ state, size }), className)}
      {...props}
    />
  )
)
WizardCard.displayName = "WizardCard"
