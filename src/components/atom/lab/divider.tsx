import * as React from "react"
import { cn } from "@/lib/utils"
import type { BaseComponentProps, Orientation } from "./types"

interface DividerProps extends BaseComponentProps {
  /**
   * Orientation of the divider
   * @default "horizontal"
   */
  orientation?: Orientation
  /**
   * Visual variant
   * @default "default"
   */
  variant?: "default" | "muted"
}

const orientationStyles: Record<Orientation, string> = {
  horizontal: "h-px w-full",
  vertical: "w-px h-full",
}

const variantStyles = {
  default: "bg-border",
  muted: "bg-border/50",
}

/**
 * Divider - Visual separator for sections
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider orientation="vertical" />
 * ```
 */
export function Divider({
  orientation = "horizontal",
  variant = "default",
  className,
  ...props
}: DividerProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0",
        orientationStyles[orientation],
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
