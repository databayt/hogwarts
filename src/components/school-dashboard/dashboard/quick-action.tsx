"use client"

import React from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getIcon } from "./config"
import type {
  QuickActionItem,
  QuickActionsGridProps,
  QuickActionVariant,
} from "./types"

// ============================================================================
// QUICK ACTION ITEM COMPONENT
// ============================================================================

interface QuickActionProps {
  action: QuickActionItem
  locale?: string
  variant?: QuickActionVariant
  className?: string
}

function QuickActionGrid({
  action,
  locale = "en",
  className,
}: Omit<QuickActionProps, "variant">) {
  const Icon = action.icon || getIcon(action.iconName)

  const content = (
    <Card
      className={cn(
        "hover:bg-muted/50 aspect-square transition-colors",
        className
      )}
    >
      <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-4">
        {Icon && <Icon className="h-6 w-6" aria-hidden />}
        <span className="text-center text-sm font-medium">{action.label}</span>
      </CardContent>
    </Card>
  )

  return (
    <Link href={`/${locale}${action.href}`} className="block">
      {content}
    </Link>
  )
}

function QuickActionList({
  action,
  locale = "en",
  className,
}: Omit<QuickActionProps, "variant">) {
  const Icon = action.icon || getIcon(action.iconName)

  return (
    <Link
      href={`/${locale}${action.href}`}
      className={cn(
        "hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors",
        className
      )}
    >
      {Icon && (
        <div className="bg-muted flex-shrink-0 rounded-md p-2">
          <Icon className="text-muted-foreground h-5 w-5" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate font-medium">{action.label}</p>
        {action.description && (
          <p className="text-muted-foreground truncate text-sm">
            {action.description}
          </p>
        )}
      </div>
    </Link>
  )
}

function QuickActionCompact({
  action,
  locale = "en",
  className,
}: Omit<QuickActionProps, "variant">) {
  const Icon = action.icon || getIcon(action.iconName)

  return (
    <Link
      href={`/${locale}${action.href}`}
      className={cn(
        "hover:bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2 transition-colors",
        className
      )}
    >
      {Icon && <Icon className="text-muted-foreground h-4 w-4" aria-hidden />}
      <span className="text-sm font-medium">{action.label}</span>
    </Link>
  )
}

function QuickActionIconOnly({
  action,
  locale = "en",
  className,
}: Omit<QuickActionProps, "variant">) {
  const Icon = action.icon || getIcon(action.iconName)

  return (
    <Link
      href={`/${locale}${action.href}`}
      className={cn(
        "hover:bg-muted/50 flex items-center justify-center rounded-md p-2 transition-colors",
        className
      )}
      title={action.label}
      aria-label={action.label}
    >
      {Icon && <Icon className="h-5 w-5" aria-hidden />}
    </Link>
  )
}

export function QuickAction({
  action,
  locale,
  variant = "grid",
  className,
}: QuickActionProps) {
  switch (variant) {
    case "list":
      return (
        <QuickActionList
          action={action}
          locale={locale}
          className={className}
        />
      )
    case "compact":
      return (
        <QuickActionCompact
          action={action}
          locale={locale}
          className={className}
        />
      )
    case "icon-only":
      return (
        <QuickActionIconOnly
          action={action}
          locale={locale}
          className={className}
        />
      )
    default:
      return (
        <QuickActionGrid
          action={action}
          locale={locale}
          className={className}
        />
      )
  }
}

// ============================================================================
// QUICK ACTIONS GRID COMPONENT
// ============================================================================

export function QuickActionsGrid({
  actions,
  title,
  columns = 4,
  variant = "grid",
  className,
}: QuickActionsGridProps & { locale?: string }) {
  const locale = "en" // Default locale, will be passed from parent

  const gridCols = {
    2: "grid-cols-2 sm:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  }

  // For icon-only variant, use different grid layout
  const iconOnlyGrid = "flex flex-wrap gap-1"

  // For list variant, use single column
  const listLayout = "flex flex-col gap-2"

  // For compact variant, use wrap layout
  const compactLayout = "flex flex-wrap gap-2"

  return (
    <div className={cn("w-full", className)}>
      {title && <h3 className="text-foreground mb-4 font-medium">{title}</h3>}
      <div
        className={cn(
          variant === "grid" && `grid gap-4 ${gridCols[columns]}`,
          variant === "list" && listLayout,
          variant === "compact" && compactLayout,
          variant === "icon-only" && iconOnlyGrid
        )}
      >
        {actions.map((action, index) => (
          <QuickAction
            key={`${action.label}-${index}`}
            action={action}
            locale={locale}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}

// Re-export getQuickActionsByRole from config.ts for backwards compatibility
// Note: This re-export allows client components to use it, but server components
// should import directly from "./config" instead
export { getQuickActionsByRole } from "./config"

// Re-export legacy name for backwards compatibility
export { QuickActionsGrid as QuickActions }
