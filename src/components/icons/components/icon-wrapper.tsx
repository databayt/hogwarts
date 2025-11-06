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

export type IconWrapperProps = IconProps & {
  /** Icon size preset */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"

  /** Loading state */
  loading?: boolean

  /** Error state */
  error?: boolean

  /** Accessible label */
  label?: string
}

/**
 * Size class mappings
 */
const SIZE_CLASSES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
  "2xl": "w-16 h-16",
} as const

/**
 * Icon Wrapper Component
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
    "inline-block",
    loading && "animate-pulse opacity-50",
    error && "text-destructive",
    className
  )

  // Accessibility attributes
  const a11yProps = label
    ? {
        "aria-label": label,
        role: "img",
      }
    : {
        "aria-hidden": "true",
      }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={iconClassName}
      {...(a11yProps as any)}
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
