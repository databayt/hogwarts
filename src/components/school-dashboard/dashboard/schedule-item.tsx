"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

import type { ScheduleItemProps } from "./types"

export function ScheduleItem({
  time,
  title,
  subtitle,
  badge,
  badgeVariant = "default",
  isActive,
  className,
}: ScheduleItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-lg border p-3 transition-colors",
        isActive && "bg-primary/5 border-primary/30",
        !isActive && "hover:bg-muted/50",
        className
      )}
    >
      <div className="w-16 flex-shrink-0 text-center">
        <span
          className={cn(
            "text-sm font-medium",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {time}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate font-medium">{title}</p>
        {subtitle && (
          <p className="text-muted-foreground truncate text-sm">{subtitle}</p>
        )}
      </div>
      {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
    </div>
  )
}
