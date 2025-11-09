'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { IconWrapper } from "./icon-wrapper"
import type { BaseComponentProps } from "./types"

interface ListItemProps extends BaseComponentProps {
  /**
   * Optional icon element
   */
  icon?: React.ReactNode
  /**
   * Main title text
   */
  title: string
  /**
   * Optional subtitle text
   */
  subtitle?: string
  /**
   * Optional trailing element (badge, chip, or value)
   */
  trailing?: React.ReactNode
  /**
   * Click handler
   */
  onClick?: () => void
}

/**
 * ListItem - Flexible list item with icon, text, and trailing content
 *
 * @example
 * ```tsx
 * <ListItem
 *   icon={<UserPlus />}
 *   title="New student enrolled"
 *   subtitle="2 minutes ago"
 *   trailing={<MetricChip label="New" variant="success" />}
 * />
 * ```
 */
export function ListItem({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  className,
  ...props
}: ListItemProps) {
  const isClickable = Boolean(onClick)

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3",
        isClickable && "cursor-pointer hover:bg-muted/50 -mx-3 px-3 rounded-lg transition-colors",
        className
      )}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      {...props}
    >
      {icon && <IconWrapper icon={icon} size="sm" variant="muted" />}

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium leading-none truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">
            {subtitle}
          </p>
        )}
      </div>

      {trailing && (
        <div className="shrink-0">
          {trailing}
        </div>
      )}
    </div>
  )
}
