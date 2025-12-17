"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

import type { FormStepProgressProps } from "../types"

/**
 * Form Step Progress (Template)
 *
 * Displays progress through a multi-step form.
 * Supports linear progress bar, dots, numbered steps, and grouped progress.
 *
 * **Role**: Visual progress indicator organism
 *
 * **Usage Across App**:
 * - Multi-step form progress bars
 * - Wizard progress indicators
 * - Onboarding step dots
 * - Long-form numbered steps
 * - Grouped progress for complex flows
 *
 * @example
 * ```tsx
 * // Linear progress bar
 * <FormStepProgress current={2} total={5} variant="linear" />
 *
 * // Dot indicators
 * <FormStepProgress current={2} total={5} variant="dots" />
 *
 * // Grouped progress (for large forms)
 * <FormStepProgress
 *   current={3}
 *   total={10}
 *   variant="grouped"
 *   groups={[
 *     { id: "info", label: "Information", steps: ["step1", "step2", "step3"] },
 *     { id: "review", label: "Review", steps: ["step4", "step5"] },
 *   ]}
 * />
 * ```
 */
export function FormStepProgress({
  current,
  total,
  groups,
  completedSteps = [],
  currentStepId,
  variant = "linear",
  showLabels = false,
  className,
}: FormStepProgressProps) {
  const progress = total > 0 ? ((current + 1) / total) * 100 : 0

  if (variant === "linear") {
    return (
      <div className={cn("space-y-2", className)}>
        <Progress value={progress} className="h-2" />
        {showLabels && (
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>
              Step {current + 1} of {total}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        )}
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        {Array.from({ length: total }).map((_, index) => {
          const isCompleted = index < current
          const isCurrent = index === current

          return (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-200",
                isCompleted && "bg-primary",
                isCurrent && "bg-primary h-3 w-3",
                !isCompleted && !isCurrent && "bg-muted"
              )}
            />
          )
        })}
      </div>
    )
  }

  if (variant === "numbered") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {Array.from({ length: total }).map((_, index) => {
          const isCompleted = index < current
          const isCurrent = index === current

          return (
            <React.Fragment key={index}>
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-200",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent &&
                    "bg-primary text-primary-foreground ring-primary/20 ring-4",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < total - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    index < current ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }

  if (variant === "grouped" && groups) {
    return (
      <div className={cn("space-y-4", className)}>
        {groups.map((group, groupIndex) => {
          const groupSteps = group.steps
          const completedInGroup = groupSteps.filter((stepId) =>
            completedSteps.includes(stepId)
          ).length
          const isCurrentGroup =
            currentStepId && groupSteps.includes(currentStepId)
          const groupProgress = (completedInGroup / groupSteps.length) * 100

          return (
            <div key={group.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isCurrentGroup ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {group.label}
                </span>
                <span className="text-muted-foreground text-xs">
                  {completedInGroup}/{groupSteps.length}
                </span>
              </div>
              <Progress value={groupProgress} className="h-1.5" />
            </div>
          )
        })}
      </div>
    )
  }

  // Default to linear
  return (
    <div className={cn("space-y-2", className)}>
      <Progress value={progress} className="h-2" />
    </div>
  )
}
