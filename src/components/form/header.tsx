"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

import type { FormStepHeaderProps } from "./types"

/**
 * Form Step Header
 *
 * Displays step title, description, and optional step indicator.
 * Used at the top of each step in a multi-step form.
 *
 * @example
 * ```tsx
 * <FormStepHeader
 *   stepNumber={1}
 *   totalSteps={4}
 *   title="Personal Information"
 *   description="Tell us about yourself"
 *   showStepIndicator
 * />
 * ```
 */
export function FormStepHeader({
  stepNumber,
  totalSteps,
  title,
  description,
  icon: Icon,
  showStepIndicator = true,
  className,
}: FormStepHeaderProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {/* Step indicator */}
      {showStepIndicator &&
        stepNumber !== undefined &&
        totalSteps !== undefined && (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
              Step {stepNumber} of {totalSteps}
            </span>
          </div>
        )}

      {/* Title with optional icon */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Icon className="text-primary h-5 w-5" />
          </div>
        )}
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          {title}
        </h2>
      </div>

      {/* Description */}
      {description && (
        <p className="text-muted-foreground text-base">{description}</p>
      )}
    </div>
  )
}
