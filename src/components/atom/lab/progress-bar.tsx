import * as React from "react"

import { cn } from "@/lib/utils"

import type { BaseComponentProps } from "./types"

interface ProgressBarProps extends BaseComponentProps {
  /**
   * Current value (0-100)
   */
  value: number
  /**
   * Maximum value
   * @default 100
   */
  max?: number
  /**
   * Visual variant
   * @default "primary"
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  /**
   * Size of the progress bar
   * @default "md"
   */
  size?: "sm" | "md" | "lg"
  /**
   * Show percentage label
   * @default false
   */
  showLabel?: boolean
}

const sizeStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
}

const variantStyles = {
  default: "bg-foreground",
  primary: "bg-primary",
  success: "bg-chart-2",
  warning: "bg-chart-3",
  danger: "bg-destructive",
}

/**
 * ProgressBar - Linear progress indicator
 *
 * @example
 * ```tsx
 * <ProgressBar value={75} variant="success" />
 * <ProgressBar value={45} showLabel />
 * ```
 */
export function ProgressBar({
  value,
  max = 100,
  variant = "primary",
  size = "md",
  showLabel = false,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn("w-full space-y-1", className)} {...props}>
      <div
        className={cn(
          "bg-muted w-full overflow-hidden rounded-full",
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            "h-full transition-all duration-300",
            variantStyles[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-muted-foreground text-xs">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  )
}
