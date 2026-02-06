"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

import type { AnnouncementCardProps } from "./types"

export function AnnouncementCard({
  title,
  content,
  date,
  author,
  priority = "normal",
  className,
}: AnnouncementCardProps) {
  const formattedDate = (() => {
    if (!date) return "-"
    if (typeof date === "string") return date
    try {
      return date.toLocaleDateString()
    } catch {
      return "-"
    }
  })()

  return (
    <div
      className={cn(
        "hover:bg-muted/50 rounded-lg border p-4 transition-colors",
        priority === "high" && "border-s-destructive border-s-4",
        className
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-foreground line-clamp-1 font-medium">{title}</h4>
        {priority === "high" && (
          <Badge variant="destructive" className="flex-shrink-0">
            Urgent
          </Badge>
        )}
      </div>
      <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
        {content}
      </p>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{formattedDate}</span>
        {author && <span>by {author}</span>}
      </div>
    </div>
  )
}
