import * as React from "react"
import { cn } from "@/lib/utils"
import type { BaseComponentProps, ComponentSize, BaseVariant } from "./types"

interface IconWrapperProps extends BaseComponentProps {
  /**
   * The icon element to display
   */
  icon: React.ReactNode
  /**
   * Visual variant
   * @default "default"
   */
  variant?: BaseVariant
  /**
   * Size of the icon container
   * @default "md"
   */
  size?: Exclude<ComponentSize, "xl">
}

const sizeStyles = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
}

const variantStyles = {
  default: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
  muted: "bg-muted/50 text-muted-foreground",
  success: "bg-chart-2/10 text-chart-2",
  warning: "bg-chart-3/10 text-chart-3",
  danger: "bg-destructive/10 text-destructive",
}

/**
 * IconWrapper - Consistent icon container with background
 *
 * @example
 * ```tsx
 * <IconWrapper icon={<Users />} variant="primary" />
 * <IconWrapper icon={<DollarSign />} size="lg" />
 * ```
 */
export function IconWrapper({
  icon,
  variant = "default",
  size = "md",
  className,
  ...props
}: IconWrapperProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-lg shrink-0",
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {icon}
    </div>
  )
}
