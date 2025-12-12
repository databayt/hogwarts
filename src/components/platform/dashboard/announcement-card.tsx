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
        "p-4 rounded-lg border transition-colors hover:bg-muted/50",
        priority === "high" && "border-l-4 border-l-destructive",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-foreground line-clamp-1">{title}</h4>
        {priority === "high" && (
          <Badge variant="destructive" className="flex-shrink-0">
            Urgent
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{content}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formattedDate}</span>
        {author && <span>by {author}</span>}
      </div>
    </div>
  )
}
