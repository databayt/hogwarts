import * as React from "react"
import { cn, nFormatter } from "@/lib/utils"
import type { BaseComponentProps, BaseVariant, ComponentSize } from "./types"

interface StatValueProps extends BaseComponentProps {
  /**
   * The numeric or string value to display
   */
  value: string | number
  /**
   * Size of the stat value
   * @default "lg"
   */
  size?: ComponentSize
  /**
   * Visual variant using semantic tokens
   * @default "default"
   */
  variant?: BaseVariant
  /**
   * Auto-format large numbers (e.g., 4812 → 4.8K)
   * @default true
   */
  format?: boolean
}

const sizeStyles: Record<ComponentSize, string> = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
  xl: "text-5xl",
}

const variantStyles: Record<BaseVariant, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-chart-2",
  warning: "text-chart-3",
  danger: "text-destructive",
  muted: "text-muted-foreground",
}

/**
 * StatValue - Displays large numeric values with optional formatting
 *
 * @example
 * ```tsx
 * <StatValue value={4812} format /> // Displays "4.8K"
 * <StatValue value="$1,234" variant="success" />
 * ```
 */
export function StatValue({
  value,
  size = "lg",
  variant = "default",
  format = true,
  className,
  ...props
}: StatValueProps) {
  const formattedValue = React.useMemo(() => {
    if (!format || typeof value !== "number") return value
    return nFormatter(value)
  }, [value, format])

  return (
    <div
      className={cn(
        "font-semibold tabular-nums tracking-tight",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {formattedValue}
    </div>
  )
}
