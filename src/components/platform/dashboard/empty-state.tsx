"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getIcon } from "./config"
import type { EmptyStateProps } from "./types"

export function EmptyState({
  icon,
  iconName,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = icon || getIcon(iconName)

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="rounded-full bg-muted p-4 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action &&
        (action.href ? (
          <Link href={action.href}>
            <Button variant="outline" size="sm">
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  )
}
