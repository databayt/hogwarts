"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { getIcon } from "./config"
import type { QuickActionItem, QuickActionVariant, QuickActionsGridProps } from "./types"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// ============================================================================
// QUICK ACTION ITEM COMPONENT
// ============================================================================

interface QuickActionProps {
  action: QuickActionItem
  locale?: string
  variant?: QuickActionVariant
  className?: string
}

function QuickActionGrid({ action, locale = "en", className }: Omit<QuickActionProps, "variant">) {
  const Icon = action.icon || getIcon(action.iconName)

  const content = (
    <Card className={cn("aspect-square transition-colors hover:bg-muted/50", className)}>
      <CardContent className="flex flex-col items-center justify-center gap-2 p-4 h-full">
        {Icon && <Icon className="h-6 w-6" aria-hidden />}
        <span className="text-sm font-medium text-center">{action.label}</span>
      </CardContent>
    </Card>
  )

  return (
    <Link href={`/${locale}${action.href}`} className="block">
      {content}
    </Link>
  )
}

function QuickActionList({ action, locale = "en", className }: Omit<QuickActionProps, "variant">) {
  const Icon = action.icon || getIcon(action.iconName)

  return (
    <Link
      href={`/${locale}${action.href}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50",
        className
      )}
    >
      {Icon && (
        <div className="flex-shrink-0 rounded-md bg-muted p-2">
          <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{action.label}</p>
        {action.description && (
          <p className="text-sm text-muted-foreground truncate">{action.description}</p>
        )}
      </div>
    </Link>
  )
}

function QuickActionCompact({ action, locale = "en", className }: Omit<QuickActionProps, "variant">) {
  const Icon = action.icon || getIcon(action.iconName)

  return (
    <Link
      href={`/${locale}${action.href}`}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-muted/50",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />}
      <span className="text-sm font-medium">{action.label}</span>
    </Link>
  )
}

function QuickActionIconOnly({ action, locale = "en", className }: Omit<QuickActionProps, "variant">) {
  const Icon = action.icon || getIcon(action.iconName)

  return (
    <Link
      href={`/${locale}${action.href}`}
      className={cn(
        "flex items-center justify-center p-2 rounded-md transition-colors hover:bg-muted/50",
        className
      )}
      title={action.label}
      aria-label={action.label}
    >
      {Icon && <Icon className="h-5 w-5" aria-hidden />}
    </Link>
  )
}

export function QuickAction({ action, locale, variant = "grid", className }: QuickActionProps) {
  switch (variant) {
    case "list":
      return <QuickActionList action={action} locale={locale} className={className} />
    case "compact":
      return <QuickActionCompact action={action} locale={locale} className={className} />
    case "icon-only":
      return <QuickActionIconOnly action={action} locale={locale} className={className} />
    default:
      return <QuickActionGrid action={action} locale={locale} className={className} />
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
      {title && <h3 className="font-medium text-foreground mb-4">{title}</h3>}
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
