import * as React from "react"
import { cn } from "@/lib/utils"
import type { BaseComponentProps } from "./types"

interface StatLabelProps extends BaseComponentProps {
  /**
   * The label text to display
   */
  label: string
  /**
   * Visual variant
   * @default "default"
   */
  variant?: "default" | "muted"
}

const variantStyles = {
  default: "text-foreground",
  muted: "text-muted-foreground",
}

/**
 * StatLabel - Secondary descriptive text for statistics
 *
 * @example
 * ```tsx
 * <StatLabel label="Total Students" />
 * <StatLabel label="vs Last Week" variant="muted" />
 * ```
 */
export function StatLabel({
  label,
  variant = "muted",
  className,
  ...props
}: StatLabelProps) {
  return (
    <p
      className={cn(
        "text-sm leading-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {label}
    </p>
  )
}
