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
        "flex items-center gap-4 p-3 rounded-lg border transition-colors",
        isActive && "bg-primary/5 border-primary/30",
        !isActive && "hover:bg-muted/50",
        className
      )}
    >
      <div className="flex-shrink-0 w-16 text-center">
        <span
          className={cn(
            "text-sm font-medium",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {time}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
    </div>
  )
}
