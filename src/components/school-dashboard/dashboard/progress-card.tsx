"use client"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import { getIcon } from "./config"
import type { ProgressCardProps } from "./types"

export function ProgressCard({
  title,
  current,
  total,
  unit = "",
  icon,
  iconName,
  color = "bg-primary",
  showPercentage = true,
  className,
}: ProgressCardProps) {
  const Icon = icon || getIcon(iconName)
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <Card className={cn("p-4", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-muted-foreground h-4 w-4" />}
          <span className="text-muted-foreground text-sm font-medium">
            {title}
          </span>
        </div>
        {showPercentage && (
          <span className="text-foreground text-sm font-medium">
            {percentage}%
          </span>
        )}
      </div>
      <Progress value={percentage} className={cn("h-2", `[&>div]:${color}`)} />
      <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
        <span>
          {current} {unit}
        </span>
        <span>
          of {total} {unit}
        </span>
      </div>
    </Card>
  )
}
