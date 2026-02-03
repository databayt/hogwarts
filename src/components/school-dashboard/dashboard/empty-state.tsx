"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
        "flex flex-col items-center justify-center px-4 py-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="bg-muted mb-4 rounded-full p-4">
          <Icon className="text-muted-foreground h-8 w-8" />
        </div>
      )}
      <h3 className="text-foreground mb-1 font-medium">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm text-sm">
          {description}
        </p>
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
