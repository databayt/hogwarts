"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface ReadStatusBadgeProps {
  isRead: boolean
  variant?: "default" | "minimal"
  className?: string
}

export function ReadStatusBadge({
  isRead,
  variant = "default",
  className,
}: ReadStatusBadgeProps) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.announcements as Record<string, any> | undefined

  const readLabel = d?.read || "Read"
  const unreadLabel = d?.unread || "Unread"

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          "flex h-2 w-2 rounded-full",
          isRead ? "bg-gray-300" : "bg-blue-500",
          className
        )}
        title={isRead ? readLabel : unreadLabel}
      />
    )
  }

  return (
    <Badge
      variant={isRead ? "secondary" : "default"}
      className={cn(
        "gap-1",
        isRead ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700",
        className
      )}
    >
      {isRead ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      {isRead ? readLabel : unreadLabel}
    </Badge>
  )
}
