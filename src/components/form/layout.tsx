"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

import type { SplitLayoutProps } from "./types"

const gapClasses = {
  sm: "gap-4 lg:gap-6",
  md: "gap-6 lg:gap-10",
  lg: "gap-6 lg:gap-14",
}

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
}

/**
 * Form Layout
 *
 * Two-column responsive layout with configurable split.
 * Stacks on mobile, row with justify-between on desktop.
 *
 * @example
 * ```tsx
 * <FormLayout split="50/50">
 *   <FormHeading title="Title" description="Description" />
 *   <div>Form content</div>
 * </FormLayout>
 *
 * <FormLayout split="30/70">
 *   <FormHeading title="Title" />
 *   <div>Wider form content</div>
 * </FormLayout>
 * ```
 */
export function FormLayout({
  children,
  className,
  split = "50/50",
  gap = "md",
  align = "start",
}: SplitLayoutProps) {
  const childArray = React.Children.toArray(children)

  // Use flex-basis for proper edge-to-edge layout with justify-between
  const leftBasis = split === "30/70" ? "lg:basis-[35%]" : "lg:basis-[45%]"
  const rightBasis = split === "30/70" ? "lg:basis-[60%]" : "lg:basis-[45%]"

  return (
    <div
      className={cn(
        "flex w-full flex-col lg:flex-row lg:justify-between",
        gapClasses[gap],
        alignClasses[align],
        className
      )}
    >
      {childArray[0] && (
        <div className={cn("w-full lg:w-auto lg:shrink-0", leftBasis)}>
          {childArray[0]}
        </div>
      )}
      {childArray[1] && (
        <div className={cn("w-full lg:w-auto lg:shrink-0", rightBasis)}>
          {childArray[1]}
        </div>
      )}
    </div>
  )
}
