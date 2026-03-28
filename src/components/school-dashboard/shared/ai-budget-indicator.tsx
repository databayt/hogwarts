"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { Infinity } from "lucide-react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface AIBudgetIndicatorProps {
  spent: number
  limit: number | null
  dictionary: Record<string, any>
  className?: string
}

function getBudgetColor(percentage: number): {
  bar: string
  text: string
} {
  if (percentage > 80) {
    return {
      bar: "[&_[data-slot=progress-indicator]]:bg-destructive",
      text: "text-destructive",
    }
  }
  if (percentage > 50) {
    return {
      bar: "[&_[data-slot=progress-indicator]]:bg-amber-500",
      text: "text-amber-700 dark:text-amber-400",
    }
  }
  return {
    bar: "[&_[data-slot=progress-indicator]]:bg-green-500",
    text: "text-green-700 dark:text-green-400",
  }
}

export const AIBudgetIndicator = React.memo(function AIBudgetIndicator({
  spent,
  limit,
  dictionary,
  className,
}: AIBudgetIndicatorProps) {
  const budgetDict = dictionary?.documentProcessing?.budget ?? {}
  const spentLabel = budgetDict.spent ?? "spent"
  const ofLabel = budgetDict.of ?? "of"
  const unlimitedLabel = budgetDict.unlimited ?? "unlimited"

  // Unlimited budget
  if (limit === null) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <Infinity
          className="text-muted-foreground h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <span className="text-muted-foreground">{unlimitedLabel}</span>
        <span className="text-foreground font-medium">
          {spent} {spentLabel}
        </span>
      </div>
    )
  }

  const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0
  const colors = getBudgetColor(percentage)

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Header row with spent/limit and percentage */}
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">
          <span className="text-foreground font-medium">{spent}</span> {ofLabel}{" "}
          <span className="text-foreground font-medium">{limit}</span>{" "}
          {spentLabel}
        </span>
        <span className={cn("text-xs font-medium", colors.text)}>
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <Progress
        value={Math.min(percentage, 100)}
        className={cn("h-2", colors.bar)}
      />
    </div>
  )
})

export type { AIBudgetIndicatorProps }
