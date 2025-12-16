"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { useLocale } from "@/components/internationalization/use-locale"

import type { FormHeadingProps } from "./types"

/**
 * Form Heading
 *
 * Title and description with automatic RTL/LTR text alignment.
 * Simpler than FormStepHeader - no step indicators or icons.
 *
 * @example
 * ```tsx
 * <FormHeading
 *   title="What's your school's name?"
 *   description="This will be your official name in the system."
 * />
 * ```
 */
export function FormHeading({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: FormHeadingProps) {
  const { isRTL } = useLocale()

  return (
    <div
      className={cn(
        "space-y-3 sm:space-y-4",
        isRTL ? "text-right" : "text-left",
        className
      )}
    >
      <h1 className={cn("text-3xl font-bold", titleClassName)}>{title}</h1>
      {description && (
        <p
          className={cn(
            "text-muted-foreground text-sm sm:text-base",
            descriptionClassName
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
