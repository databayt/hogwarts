"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export interface SectionHeadingProps {
  /** Section title text */
  title: string
  /** Optional icon component */
  icon?: LucideIcon
  /** Optional badge with label and variant */
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
    className?: string
  }
  /** Optional action link or button */
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  /** Optional description text below title */
  description?: string
  /** Additional CSS classes */
  className?: string
  /** Title CSS classes */
  titleClassName?: string
}

/**
 * Unified section heading component for dashboard sections.
 * Provides consistent styling with optional icon, badge, and action.
 *
 * @example
 * <SectionHeading
 *   title="Financial Overview"
 *   icon={DollarSign}
 *   badge={{ label: "4 pending", variant: "secondary" }}
 *   action={{ label: "View All", href: "/finance" }}
 * />
 */
export function SectionHeading({
  title,
  icon: Icon,
  badge,
  action,
  description,
  className,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
        <div>
          <h2 className={cn("text-lg font-semibold", titleClassName)}>
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {badge && (
          <Badge
            variant={badge.variant || "secondary"}
            className={cn("ml-2", badge.className)}
          >
            {badge.label}
          </Badge>
        )}
      </div>

      {action && (
        action.href ? (
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href={action.href}>
              {action.label}
              <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={action.onClick}
          >
            {action.label}
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        )
      )}
    </div>
  )
}

/**
 * Minimal section heading without any decorations.
 * Just the title with consistent styling.
 */
export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2 className={cn("mb-4 text-lg font-semibold", className)}>
      {children}
    </h2>
  )
}
