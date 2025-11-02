import * as React from "react"
import { cn } from "@/lib/utils"
import { IconWrapper } from "./icon-wrapper"
import { StatValue } from "./stat-value"
import { StatLabel } from "./stat-label"
import type { BaseComponentProps } from "./types"

interface IconStatProps extends BaseComponentProps {
  /**
   * The icon element
   */
  icon: React.ReactNode
  /**
   * The numeric or string value
   */
  value: string | number
  /**
   * The descriptive label
   */
  label: string
  /**
   * Visual variant
   * @default "default"
   */
  variant?: "default" | "primary" | "muted"
}

/**
 * IconStat - Combines icon, value, and label
 *
 * @example
 * ```tsx
 * <IconStat
 *   icon={<Users />}
 *   value="28"
 *   label="Total Students"
 *   variant="primary"
 * />
 * ```
 */
export function IconStat({
  icon,
  value,
  label,
  variant = "default",
  className,
  ...props
}: IconStatProps) {
  return (
    <div className={cn("flex items-start gap-3", className)} {...props}>
      <IconWrapper icon={icon} variant={variant} />
      <div className="flex flex-col gap-1 min-w-0">
        <StatValue value={value} size="md" />
        <StatLabel label={label} />
      </div>
    </div>
  )
}
