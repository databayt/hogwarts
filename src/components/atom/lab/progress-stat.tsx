import * as React from "react"

import { cn } from "@/lib/utils"

import { ProgressBar } from "./progress-bar"
import { StatLabel } from "./stat-label"
import { StatValue } from "./stat-value"
import type { BaseComponentProps } from "./types"

interface ProgressStatProps extends BaseComponentProps {
  /**
   * Current progress value (0-100)
   */
  value: number
  /**
   * Maximum value
   * @default 100
   */
  max?: number
  /**
   * The descriptive label
   */
  label: string
  /**
   * Show percentage value
   * @default true
   */
  showPercentage?: boolean
  /**
   * Visual variant
   * @default "primary"
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger"
}

/**
 * ProgressStat - Combines progress bar, value, and label
 *
 * @example
 * ```tsx
 * <ProgressStat
 *   value={85}
 *   label="Attendance Rate"
 *   variant="success"
 * />
 * ```
 */
export function ProgressStat({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = "primary",
  className,
  ...props
}: ProgressStatProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <div className="flex items-baseline justify-between gap-2">
        <StatLabel label={label} />
        {showPercentage && (
          <StatValue
            value={`${Math.round(percentage)}%`}
            size="sm"
            variant={variant}
          />
        )}
      </div>
      <ProgressBar value={value} max={max} variant={variant} />
    </div>
  )
}
