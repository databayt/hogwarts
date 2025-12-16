"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

import type { FormStepContainerProps } from "./types"

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
}

/**
 * Form Step Container
 *
 * Wrapper component for step content with consistent styling.
 * Provides max-width constraints and spacing.
 *
 * @example
 * ```tsx
 * <FormStepContainer maxWidth="lg">
 *   <FormStepHeader title="Personal Information" />
 *   <PersonalInfoForm />
 * </FormStepContainer>
 * ```
 */
export function FormStepContainer({
  children,
  className,
  maxWidth = "2xl",
}: FormStepContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6",
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
}
