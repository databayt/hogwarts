"use client"

/**
 * Icon Wrapper Component
 *
 * Provides a consistent wrapper for all icons with:
 * - Theme support (currentColor)
 * - Size presets
 * - Loading states
 * - Accessibility props
 * - Error handling
 */

import { cn } from "@/lib/utils"
import type { IconProps } from "../types"

/**
 * Size class mappings (using modern `size-*` utilities)
 */
export const SIZE_CLASSES = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
  "2xl": "size-10",
} as const

export type IconSize = keyof typeof SIZE_CLASSES

export type IconWrapperProps = IconProps & {
  /** Icon size preset */
  size?: IconSize

  /** Loading state */
  loading?: boolean

  /** Error state */
  error?: boolean

  /** Accessible label */
  label?: string
}

/**
 * Icon Wrapper Component
 *
 * Use for wrapping custom SVG children:
 * ```tsx
 * <IconWrapper size="md" label="Custom icon">
 *   <path d="..." />
 * </IconWrapper>
 * ```
 *
 * For named icons, use the Icon component or Icons namespace instead:
 * ```tsx
 * import { Icons } from "@/components/icons"
 * <Icons.github className="size-5" />
 * ```
 */
export function IconWrapper({
  size = "md",
  loading = false,
  error = false,
  label,
  className,
  children,
  ...props
}: IconWrapperProps) {
  // Build className
  const iconClassName = cn(
    SIZE_CLASSES[size],
    "inline-block shrink-0",
    loading && "animate-pulse opacity-50",
    error && "text-destructive",
    className
  )

  // Accessibility attributes
  const a11yProps = label
    ? {
        "aria-label": label,
        role: "img" as const,
      }
    : {
        "aria-hidden": true as const,
      }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={iconClassName}
      {...a11yProps}
      {...props}
    >
      {children}
    </svg>
  )
}

/**
 * Icon Loading Skeleton
 */
export function IconSkeleton({
  size = "md",
  className,
}: {
  size?: IconWrapperProps["size"]
  className?: string
}) {
  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        "rounded bg-muted animate-pulse",
        className
      )}
      aria-hidden="true"
    />
  )
}

/**
 * Icon Error Fallback
 */
export function IconError({
  size = "md",
  message = "Icon failed to load",
  className,
}: {
  size?: IconWrapperProps["size"]
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        "flex items-center justify-center rounded border-2 border-dashed border-destructive text-destructive",
        className
      )}
      title={message}
      aria-label={message}
    >
      <span className="text-xs font-bold">?</span>
    </div>
  )
}
