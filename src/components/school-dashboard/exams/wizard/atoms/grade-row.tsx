// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { forwardRef } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export const gradeRowVariants = cva(
  "flex items-center gap-3 rounded-lg border px-4 py-2 transition-colors",
  {
    variants: {
      tier: {
        excellent:
          "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20",
        good: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20",
        average:
          "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20",
        failing:
          "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20",
      },
    },
    defaultVariants: { tier: "average" },
  }
)

interface GradeRowProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gradeRowVariants> {}

export const GradeRow = forwardRef<HTMLDivElement, GradeRowProps>(
  ({ className, tier, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(gradeRowVariants({ tier }), className)}
      {...props}
    />
  )
)
GradeRow.displayName = "GradeRow"

export function getTier(
  minPercent: number
): "excellent" | "good" | "average" | "failing" {
  if (minPercent >= 85) return "excellent"
  if (minPercent >= 70) return "good"
  if (minPercent >= 50) return "average"
  return "failing"
}
