import * as React from "react"

import { cn } from "@/lib/utils"

import type { BaseComponentProps, BaseVariant } from "./types"

interface MetricChipProps extends BaseComponentProps {
  /**
   * The text label to display
   */
  label: string
  /**
   * Visual variant
   * @default "default"
   */
  variant?: BaseVariant
  /**
   * Size of the chip
   * @default "md"
   */
  size?: "sm" | "md"
}

const sizeStyles = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
}

const variantStyles: Record<BaseVariant, string> = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-chart-2/10 text-chart-2",
  warning: "bg-chart-3/10 text-chart-3",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted/50 text-muted-foreground",
}

/**
 * MetricChip - Small status or category badge
 *
 * @example
 * ```tsx
 * <MetricChip label="New" variant="success" />
 * <MetricChip label="Pending" variant="warning" size="sm" />
 * ```
 */
export function MetricChip({
  label,
  variant = "default",
  size = "md",
  className,
  ...props
}: MetricChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {label}
    </span>
  )
}
